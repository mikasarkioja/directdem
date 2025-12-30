"use server";

/**
 * BankID Authentication using Criipto OIDC
 * This is a placeholder implementation for FTN BankID integration
 */

export interface BankIDUser {
  full_name: string;
  is_verified: boolean;
  email?: string;
  ssn?: string; // Social Security Number (for verification)
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
    full_name: "Matti Meikäläinen",
    is_verified: true,
    email: "matti.meikalainen@example.com",
    ssn: "010190-123A", // Mock SSN for verification
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
  
  // Production: Exchange code for token
  // This would make a request to Criipto token endpoint
  // Then verify and parse the ID token
  // For now, return mock data
  return mockBankIDCallback(code);
}

