import { NextResponse } from "next/server";

/**
 * Notice: Manual password-based registration is deprecated.
 * Authentication for Hult Prize HITK is strictly unified under official Google OAuth (@heritageit.edu.in).
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Manual registration is disabled. Please sign in directly using your official college Google account (@heritageit.edu.in) at /register.",
    },
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Authentication for Hult Prize HITK is handled securely via Google OAuth (@heritageit.edu.in).",
    },
    { status: 200 }
  );
}
