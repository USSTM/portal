export const idleLifetimeMs = 12 * 60 * 60 * 1000
export const absoluteLifetimeMs = 7 * 24 * 60 * 60 * 1000

type SessionLifetime = {
  absoluteExpiresAt: Date
  idleExpiresAt: Date
  revokedAt: Date | null
}

export function evaluateSession(session: SessionLifetime, now = new Date()) {
  if (
    session.revokedAt ||
    session.idleExpiresAt <= now ||
    session.absoluteExpiresAt <= now
  ) {
    return { active: false } as const
  }

  return {
    active: true,
    nextIdleExpiresAt: new Date(
      Math.min(
        now.getTime() + idleLifetimeMs,
        session.absoluteExpiresAt.getTime(),
      ),
    ),
  } as const
}
