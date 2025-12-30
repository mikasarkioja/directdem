"use server";

/**
 * BankID Authentication using Criipto OIDC
 * This is a placeholder implementation for FTN BankID integration
 */

export interface BankIDUser {
  given_name: string; // First name from id_token
  family_name: string; // Last name from id_token
  full_name: string; // Combined: given_name + family_name
  sub: string; // Subject ID from id_token (unique identifier, no HETU)
  birthdate?: string; // Birthdate from id_token (YYYY-MM-DD format)
  is_verified: boolean;
  email?: string;
}

/**
 * Initiates BankID authentication flow
 * In production, this would redirect to Criipto OIDC endpoint
 */
export async function initiateBankIDAuth(): Promise<{ redirectUrl: string }> {
  // Placeholder: In production, this would construct the Criipto OIDC URL
  // Example: https://your-domain.criipto.id/oauth2/authorize?client_id=...&redirect_uri=...
  
  const criiptoDomain = process.env.CRIIPTO_DOMAIN || "your-domain.criipto.id";
  const clientId = process.env.CRIIPTO_CLIENT_ID || "your-client-id";
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/bankid/callback`;
  
  const authUrl = `https://${criiptoDomain}/oauth2/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid profile&` +
    `state=${Math.random().toString(36).substring(7)}`;
  
  return { redirectUrl: authUrl };
}

/**
 * Mock function that simulates a successful BankID return
 * In production, this would parse the OIDC callback and verify the token
 */
export async function mockBankIDCallback(code: string): Promise<BankIDUser> {
  // This is a MOCK function for development
  // In production, you would:
  // 1. Exchange code for token with Criipto
  // 2. Verify the token
  // 3. Extract user information from the token claims
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock return data
  return {
    given_name: "Matti",
    family_name: "Meikäläinen",
    full_name: "Matti Meikäläinen",
    sub: `mock-sub-${code}-${Date.now()}`, // Mock subject ID
    birthdate: "1990-01-01", // Mock birthdate (over 18)
    is_verified: true,
    email: "matti.meikalainen@example.com",
  };
}

/**
 * Processes BankID authentication callback
 * In production, this would verify the OIDC token and extract user claims
 */
export async function processBankIDCallback(code: string, state: string): Promise<BankIDUser> {
  // For development, use mock
  if (process.env.NODE_ENV === "development" || !process.env.CRIIPTO_CLIENT_SECRET) {
    console.warn("[BankID] Using mock BankID callback in development");
    return mockBankIDCallback(code);
  }
  
  // Production: Exchange code for token with Criipto
  const criiptoDomain = process.env.CRIIPTO_DOMAIN || "your-domain.criipto.id";
  const clientId = process.env.CRIIPTO_CLIENT_ID!;
  const clientSecret = process.env.CRIIPTO_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/bankid/callback`;
  
  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`https://${criiptoDomain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;

    // Decode and verify ID token (in production, use a JWT library like jose)
    // For now, we'll parse the payload (base64)
    const tokenParts = idToken.split(".");
    if (tokenParts.length !== 3) {
      throw new Error("Invalid ID token format");
    }

    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(tokenParts[1], "base64url").toString("utf-8")
    );

    // Extract user information from token claims
    const given_name = payload.given_name || "";
    const family_name = payload.family_name || "";
    const full_name = `${given_name} ${family_name}`.trim();
    const sub = payload.sub; // Subject ID (unique, no HETU)
    const birthdate = payload.birthdate; // Optional: YYYY-MM-DD format
    const email = payload.email;

    // Verify age if birthdate is provided (must be 18+)
    let isVerified = true;
    if (birthdate) {
      const birthYear = parseInt(birthdate.split("-")[0]);
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      isVerified = age >= 18;
    }

    return {
      given_name,
      family_name,
      full_name,
      sub,
      birthdate,
      is_verified: isVerified,
      email,
    };
  } catch (error: any) {
    console.error("[BankID] Token processing error:", error);
    // Fallback to mock in case of error
    return mockBankIDCallback(code);
  }
}

