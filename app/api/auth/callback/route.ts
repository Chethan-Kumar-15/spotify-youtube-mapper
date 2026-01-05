import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSpotifyClient } from "@/lib/spotify";

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle Spotify authorization errors
  if (error) {
    return NextResponse.redirect(`${baseUrl}?error=${encodeURIComponent(error)}`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("sp_oauth_state")?.value;

  // Validate state parameter
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}?error=invalid_state`);
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(`${baseUrl}?error=missing_code`);
  }

  cookieStore.delete("sp_oauth_state");

  const spotify = createSpotifyClient();

  try {
    const data = await spotify.authorizationCodeGrant(code);

    // Store ONLY refresh_token
    cookieStore.set(
      "sp_refresh_token",
      data.body.refresh_token!,
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      }
    );

    return NextResponse.redirect(baseUrl);
  } catch (err) {
    console.error('Token exchange failed:', err);
    return NextResponse.redirect(`${baseUrl}?error=auth_failed`);
  }
}
