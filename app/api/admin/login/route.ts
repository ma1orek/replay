import { NextRequest, NextResponse } from "next/server";

// Admin credentials from environment variables (secure)
// In Vercel, set: ADMIN_EMAIL and ADMIN_PASSWORD
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET; // Support both names

export async function POST(request: NextRequest) {
  try {
    // Check if admin credentials are configured
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("Admin credentials not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in env vars.");
      return NextResponse.json({ error: "Admin not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables." }, { status: 500 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Verify credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Generate token for subsequent API calls
      const token = Buffer.from(`${email}:${password}`).toString("base64");
      return NextResponse.json({ 
        success: true, 
        token,
        email: ADMIN_EMAIL 
      });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

