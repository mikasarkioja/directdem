import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { processTransaction } from "@/lib/logic/economy";

export const dynamic = "force-dynamic";

// Mapping Price IDs to Credit amounts
const PRICE_TO_CREDITS: Record<string, number> = {
  "price_credits_100": 100,
  "price_credits_500": 500,
  "price_credits_1000": 1000,
  "price_sub_premium": 1500,
  "price_sub_researcher": 3000, // Double credits for researchers
};

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      console.error("Webhook Error: Missing signature or webhook secret");
      return new Response("Webhook Error: Missing signature or webhook secret", { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (!metadata?.userId) {
          console.error("Webhook Error: No userId in session metadata");
          break;
        }

        const userId = metadata.userId;
        const priceId = metadata.priceId || "";

        if (metadata.type === "credits") {
          const amount = PRICE_TO_CREDITS[priceId] || 100; // Default to 100 if unknown
          await processTransaction(userId, amount, `Stripe Purchase: ${amount} credits`, "EARN");
        }
        
        if (metadata.type === "subscription") {
          const monthlyCredits = PRICE_TO_CREDITS[priceId] || 1500;
          const planType = priceId === "price_sub_researcher" ? "researcher" : "premium";
          
          await supabase
            .from("user_profiles")
            .update({ 
              subscription_status: "active",
              plan_type: planType
            })
            .eq("id", userId);
          
          // Add initial monthly credits
          await processTransaction(userId, monthlyCredits, `Subscription ${planType} Quota (Initial)`, "EARN");
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Find user by customerId
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id, plan_type")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile && (invoice as any).subscription) {
          await supabase
            .from("user_profiles")
            .update({ subscription_status: "active" })
            .eq("id", profile.id);

          // Renew monthly credits on successful invoice payment
          // For premium plan, give 1500 credits
          const renewalCredits = 1500; 
          await processTransaction(profile.id, renewalCredits, "Subscription Monthly Quota (Renewal)", "EARN");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          await supabase
            .from("user_profiles")
            .update({ 
              subscription_status: "inactive",
              plan_type: "free"
            })
            .eq("id", profile.id);
            
          // Optional: Add log to transactions about subscription end
          await supabase.from("transactions").insert({
            user_id: profile.id,
            amount: 0,
            points_type: 'CREDIT',
            action_type: 'SPEND',
            description: "Subscription Cancelled / Ended",
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (dbError: any) {
    console.error("Webhook Database Update Error:", dbError);
    // Still return 200 to Stripe but log the error
    return NextResponse.json({ received: true, error: dbError.message });
  }
}
