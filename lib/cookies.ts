import { CookieOptions } from "next/headers";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",   // 🚨 REQUIRED FOR OAUTH
  path: "/",
};