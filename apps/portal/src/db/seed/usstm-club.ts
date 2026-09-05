import { getDb } from '../index.ts'
import { clubs } from '../schema.ts'

export const USSTM_CLUB_ID = '51c3e4b2-350c-4654-b5c4-bf0411ec738e'

export async function ensureUsstmClub(): Promise<void> {
  await getDb()
    .insert(clubs)
    .values({
      contactEmail: null,
      fullName: 'USSTM',
      id: USSTM_CLUB_ID,
      lifecycle: 'active',
      protected: true,
      shortName: 'USSTM',
    })
    .onConflictDoNothing()
}
