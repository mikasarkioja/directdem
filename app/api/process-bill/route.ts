import { NextRequest, NextResponse } from "next/server";
import { processBillToSelkokieli } from "@/app/actions/process-bill";

export const maxDuration = 300; // 5 minutes

/**
 * API route to process bill with progress updates
 * This allows us to provide progress feedback to the client
 */
export async function POST(request: NextRequest) {
  try {
    const { billId } = await request.json();

    if (!billId) {
      return NextResponse.json(
        { error: "billId is required" },
        { status: 400 }
      );
    }

    // Process the bill
    const result = await processBillToSelkokieli(billId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error processing bill:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

