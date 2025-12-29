import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { authCookieOptions } from "@/lib/cookies";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const cookieStore = cookies();
  cookieStore.set("sp_state", state, authCookieOptions);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: "playlist-read-private playlist-read-collaborative",
    redirect_uri: process.env.REDIRECT_URI!,
    state,
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}
