import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { createSpotifyClient } from "@/lib/spotify";
import { authCookieOptions } from "@/lib/cookies";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("sp_state", state, authCookieOptions);

  const spotify = createSpotifyClient();

  const authUrl = spotify.createAuthorizeURL(
    ["playlist-read-private"],
    state
  );

  return NextResponse.redirect(authUrl);
}
