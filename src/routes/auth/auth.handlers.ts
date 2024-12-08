import type { Context } from "hono";

import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { createKindeClient, sessionManager } from "@/lib/kinde";

import type { CaptureRoute } from "./auth.routes";

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
  return c.json({ user }, HttpStatusCodes.OK);
}

export const capture: AppRouteHandler<CaptureRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userToCapture = c.req.valid("json");

  const { db } = createDb(c.env);
  // Check if user exists in database
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.authUserId, user.id),
  });

  if (existingUser) {
    return c.json({
      message: "User already exists",
      user: existingUser,
    }, HttpStatusCodes.OK);
  }

  // Create new user
  const [newUser] = await db.insert(users)
    .values({
      email: userToCapture.email,
      displayName: userToCapture.displayName,
      authUserId: user.id,
    })
    .returning();

  return c.json({
    message: "User created successfully",
    user: newUser,
  }, HttpStatusCodes.CREATED);
};
