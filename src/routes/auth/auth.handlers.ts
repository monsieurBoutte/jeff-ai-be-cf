import type { Context } from "hono";

import { kindeClient, sessionManager } from "@/lib/kinde";

export async function login(c: Context) {
  const loginUrl = await kindeClient.login(sessionManager(c));
  return c.redirect(loginUrl.toString());
}

export async function register(c: Context) {
  const registerUrl = await kindeClient.register(sessionManager(c));
  return c.redirect(registerUrl.toString());
}

export async function callback(c: Context) {
  // this gets called after the user is authenticated via login or register
  const url = new URL(c.req.url);
  await kindeClient.handleRedirectToApp(sessionManager(c), url);
  return c.redirect("/");
}

export async function logout(c: Context) {
  const logoutUrl = await kindeClient.logout(sessionManager(c));
  return c.redirect(logoutUrl.toString());
}

export async function me(c: Context) {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json({ user }, 200);
}
