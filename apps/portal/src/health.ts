export function getLiveness() {
  return { service: 'portal', status: 'ok' } as const
}

export async function getReadiness(checkDatabase: () => Promise<void>) {
  try {
    await checkDatabase()
    return { service: 'portal', status: 'ok' } as const
  } catch {
    return { service: 'portal', status: 'unavailable' } as const
  }
}
