import type { Context } from "hono";

import { createKindeClient, sessionManager } from "@/lib/kinde";

export async function login(c: Context) {
  const kindeClient = createKindeClient(c);
  const loginUrl = await kindeClient.login(sessionManager(c));
  return c.redirect(loginUrl.toString());
}

export async function register(c: Context) {
  const kindeClient = createKindeClient(c);
  const registerUrl = await kindeClient.register(sessionManager(c));
  return c.redirect(registerUrl.toString());
}

export async function callback(c: Context) {
  // this gets called after the user is authenticated via login or register
  // todo add a check to see if the user is already in the database
  // if not, add them
  const kindeClient = createKindeClient(c);
  const url = new URL(c.req.url);
  await kindeClient.handleRedirectToApp(sessionManager(c), url);
  return c.redirect("/");
}

export async function logout(c: Context) {
  const kindeClient = createKindeClient(c);
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
