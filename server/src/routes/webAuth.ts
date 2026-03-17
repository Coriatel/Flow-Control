import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import prisma from "../utils/prisma";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { createRefreshTokenForUser } from "../utils/refreshTokens";
import {
  getOauthStateCookieOptions,
  getRefreshTokenCookieOptions,
  OAUTH_STATE_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../utils/authCookies";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const allowedHosts = new Set([
  "flow.coriathost.cloud",
  "dev.flow.coriathost.cloud",
]);

const getBaseUrl = (req: Request): string => {
  const host = req.get("host");
  if (!host) {
    throw new AppError("Missing Host header", 400);
  }

  // Basic host allow-list to prevent Host header abuse.
  // If you add more Flow domains, update this list.
  const hostname = req.hostname;
  if (!allowedHosts.has(hostname)) {
    throw new AppError("Invalid host", 400);
  }

  return `https://${host}`;
};

const getGoogleRedirectUri = (req: Request): string => {
  return `${getBaseUrl(req)}/auth/google/callback`;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const router = Router();

router.get(
  "/google",
  asyncHandler(async (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new AppError("Google auth is not configured", 500);
    }

    const redirectUri = getGoogleRedirectUri(req);

    const state = crypto.randomBytes(16).toString("hex");
    res.cookie(OAUTH_STATE_COOKIE_NAME, state, getOauthStateCookieOptions());

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });

    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  }),
);

router.get(
  "/google/callback",
  asyncHandler(async (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new AppError("Google auth is not configured", 500);
    }

    const redirectUri = getGoogleRedirectUri(req);

    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const stateCookie =
      (req.cookies && req.cookies[OAUTH_STATE_COOKIE_NAME]) || null;

    // Clear state cookie regardless of outcome
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, getOauthStateCookieOptions());

    if (!code) {
      return res.redirect("/login?oauth=missing_code");
    }

    if (!state || !stateCookie || state !== stateCookie) {
      return res.redirect("/login?oauth=bad_state");
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = (await tokenRes.json().catch(() => null)) as null | {
      access_token?: string;
    };
    if (!tokenRes.ok || !tokenJson || !tokenJson.access_token) {
      return res.redirect("/login?oauth=token_exchange_failed");
    }

    // Fetch verified user info
    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
      },
    });

    const userInfo = (await userInfoRes.json().catch(() => null)) as null | {
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    if (!userInfoRes.ok || !userInfo || !userInfo.email) {
      return res.redirect("/login?oauth=userinfo_failed");
    }

    if (userInfo.email_verified === false) {
      return res.redirect("/login?oauth=email_not_verified");
    }

    const email = normalizeEmail(String(userInfo.email));
    const name = userInfo.name ? String(userInfo.name) : email;

    // Find or create user in the main app table (inventory.app_users)
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // New Google user — create as INACTIVE, requires admin approval.
      const randomPassword = crypto.randomBytes(32).toString("base64url");
      const hashed = await bcrypt.hash(randomPassword, 10);

      await prisma.user.create({
        data: {
          email,
          name,
          password: hashed,
          role: "USER",
          isActive: false,
        },
      });

      return res.redirect("/login?oauth=pending_approval");
    }

    if (!user.isActive) {
      return res.redirect("/login?oauth=pending_approval");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        // Keep name updated but avoid overwriting with empty.
        name: user.name || name,
      },
    });

    // Issue refresh token cookie; SPA will call /api/auth/refresh to get an access token.
    const refreshToken = await createRefreshTokenForUser(user.id, {
      ip: req.ip,
      userAgent: req.get("user-agent") || null,
    });

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      getRefreshTokenCookieOptions(),
    );

    // Redirect into the SPA.
    res.redirect("/dashboard");
  }),
);

export default router;
