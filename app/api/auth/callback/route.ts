import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSpotifyClient } from "@/lib/spotify";
import { authCookieOptions } from "@/lib/cookies";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const storedState = cookies().get("sp_state")?.value;

  if (!code || !state || state !== storedState) {
    return new NextResponse("Invalid state", { status: 403 });
  }

  cookies().delete("sp_state");

  const spotify = createSpotifyClient();

  const data = await spotify.authorizationCodeGrant(code);

  // ❌ DO NOT STORE ACCESS TOKEN
  cookies().set(
    "sp_refresh_token",
    data.body.refresh_token!,
    authCookieOptions
  );

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_BASE_URL}/`
  );
}
