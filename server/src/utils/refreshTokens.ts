import crypto from 'crypto';

import { prisma } from './prisma';
import { REFRESH_TOKEN_TTL_MS } from './authCookies';

let initPromise: Promise<void> | null = null;

const ensureRefreshTokensTableImpl = async (): Promise<void> => {
  // Use the connection's configured schema. This keeps the helper aligned with
  // Prisma's DATABASE_URL instead of assuming production's historical name.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      replaced_by_token_hash TEXT,
      ip TEXT,
      user_agent TEXT,
      device_label TEXT
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx
    ON refresh_tokens (user_id);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx
    ON refresh_tokens (expires_at);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS refresh_tokens_revoked_at_idx
    ON refresh_tokens (revoked_at);
  `);
};

export const ensureRefreshTokensTable = async (): Promise<void> => {
  if (!initPromise) {
    initPromise = ensureRefreshTokensTableImpl();
  }
  await initPromise;
};

export const generateRefreshToken = (): string => {
  // base64url is cookie-safe (no +,/,
  return crypto.randomBytes(32).toString('base64url');
};

export const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export type RefreshTokenMeta = {
  ip?: string | null;
  userAgent?: string | null;
  deviceLabel?: string | null;
};

export const createRefreshTokenForUser = async (
  userId: string,
  meta: RefreshTokenMeta = {}
): Promise<string> => {
  await ensureRefreshTokensTable();

  const token = generateRefreshToken();
  const tokenHash = hashRefreshToken(token);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.$executeRaw`
    INSERT INTO refresh_tokens (
      id, user_id, token_hash, expires_at, ip, user_agent, device_label
    ) VALUES (
      ${id}, ${userId}, ${tokenHash}, ${expiresAt}, ${meta.ip ?? null}, ${meta.userAgent ?? null}, ${meta.deviceLabel ?? null}
    )
  `;

  return token;
};

export const rotateRefreshToken = async (
  oldToken: string,
  meta: RefreshTokenMeta = {}
): Promise<{ userId: string; newToken: string } | null> => {
  await ensureRefreshTokensTable();

  const now = new Date();
  const oldHash = hashRefreshToken(oldToken);

  const newToken = generateRefreshToken();
  const newHash = hashRefreshToken(newToken);
  const newId = crypto.randomUUID();
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.$queryRaw<{ user_id: string }[]>`
      UPDATE refresh_tokens
      SET revoked_at = ${now}, replaced_by_token_hash = ${newHash}
      WHERE token_hash = ${oldHash}
        AND revoked_at IS NULL
        AND expires_at > ${now}
      RETURNING user_id
    `;

    if (updated.length === 0) {
      return null;
    }

    const userId = updated[0].user_id;

    await tx.$executeRaw`
      INSERT INTO refresh_tokens (
        id, user_id, token_hash, expires_at, ip, user_agent, device_label
      ) VALUES (
        ${newId}, ${userId}, ${newHash}, ${newExpiresAt}, ${meta.ip ?? null}, ${meta.userAgent ?? null}, ${meta.deviceLabel ?? null}
      )
    `;

    return { userId, newToken };
  });

  return result;
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await ensureRefreshTokensTable();

  const tokenHash = hashRefreshToken(token);
  const now = new Date();

  await prisma.$executeRaw`
    UPDATE refresh_tokens
    SET revoked_at = ${now}
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
  `;
};
