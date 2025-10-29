import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()?.replace(/\/$/, "") || "";

  try {
    // Call backend logout endpoint with cookies from the request
    const backendResponse = await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        // Forward cookies from the request to ensure backend session is cleared
        Cookie: request.headers.get("cookie") || "",
      },
    });

    console.log("Backend logout response:", backendResponse.status);
  } catch (error) {
    console.error("Backend logout failed:", error);
    // Continue even if backend logout fails to avoid blocking user sign-out
  }

  // Redirect to home page after logout
  const redirectUrl = new URL("/", request.url);
  const response = NextResponse.redirect(redirectUrl);
  
  // Clear any local session cookies if needed
  response.cookies.delete("session");
  
  return response;
}

export async function POST(request: NextRequest) {
  // Support both GET and POST for flexibility
  return GET(request);
}

