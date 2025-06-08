import { NextResponse } from "next/server";

export async function GET() {
  // Only allow this in development or with a secret key
  if (process.env.NODE_ENV === "production" && !process.env.DEBUG_SECRET) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    nextauthUrl: process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing",
    nextauthSecret: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing",
    googleClientId: process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
    databaseUrl: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
  });
} 