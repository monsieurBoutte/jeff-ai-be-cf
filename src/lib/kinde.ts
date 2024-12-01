import type { Context } from "hono";

import {
  createKindeServerClient,
  GrantType,
  type SessionManager,
  type UserType,
} from "@kinde-oss/kinde-typescript-sdk";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, jwtVerify } from "jose";

export function sessionManager(c: Context): SessionManager {
  return {
    async getSessionItem(key: string) {
      const result = getCookie(c, key);
      return result;
    },
    async setSessionItem(key: string, value: unknown) {
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      } as const;
      if (typeof value === "string") {
        setCookie(c, key, value, cookieOptions);
      }
      else {
        setCookie(c, key, JSON.stringify(value), cookieOptions);
      }
    },
    async removeSessionItem(key: string) {
      deleteCookie(c, key);
    },
    async destroySession() {
      ["id_token", "access_token", "user", "refresh_token"].forEach((key) => {
        deleteCookie(c, key);
      });
    },
  };
}

interface Env {
  Variables: {
    user: UserType;
  };
}

async function verifyBearerToken(token: string, issuerBaseUrl: string) {
  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${issuerBaseUrl}/.well-known/jwks.json`),
    );

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: issuerBaseUrl,
    });

    return payload;
  }
  catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export const getUser = createMiddleware<Env>(async (c: Context, next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = await verifyBearerToken(token, c.env.KINDE_ISSUER_BASE_URL);

      if (!payload) {
        return c.json({ error: "Invalid token" }, 401);
      }

      const user: UserType = {
        id: payload.sub as string,
        given_name: payload.given_name as string,
        family_name: payload.family_name as string,
        email: payload.email as string,
        picture: payload?.picture as string,
      };

      c.set("user", user);
      await next();
      return;
    }

    const kindeClient = createKindeClient(c);
    const manager = sessionManager(c);
    const isAuthenticated = await kindeClient.isAuthenticated(manager);

    if (!isAuthenticated) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await kindeClient.getUserProfile(manager);
    c.set("user", user);
    await next();
  }
  catch (e) {
    console.error(e);
    return c.json({ error: "Unauthorized" }, 401);
  }
});

export function createKindeClient(c: Context) {
  const env = c.env;
  return createKindeServerClient(GrantType.AUTHORIZATION_CODE, {
    authDomain: env.KINDE_ISSUER_BASE_URL,
    clientId: env.KINDE_CLIENT_ID,
    clientSecret: env.KINDE_SECRET,
    redirectURL: env.KINDE_REDIRECT_URL,
    logoutRedirectURL: env.KINDE_SITE_URL,
  });
}
