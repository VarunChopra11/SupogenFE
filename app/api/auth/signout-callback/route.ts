import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim()?.replace(/\/$/, "") || "";

  try {
    const url = `${apiBaseUrl}/auth/signout`;
    await fetch(url, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Error during signout:", error);
  }

  const redirectUrl = new URL("/", request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Clear any local session cookies if needed
  response.cookies.delete("session");

  return response;
}

// Edge runtime (optional)
export async function POST(request: NextRequest) {
  return GET(request);
}
