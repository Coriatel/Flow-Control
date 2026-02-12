import type { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'flow_rt';
export const OAUTH_STATE_COOKIE_NAME = 'flow_oauth_state';

export const REFRESH_TOKEN_TTL_DAYS = 30;
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  // Limit where the refresh token is sent.
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_TTL_MS,
});

export const getOauthStateCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/auth/google/callback',
  maxAge: 10 * 60 * 1000, // 10 minutes
});
