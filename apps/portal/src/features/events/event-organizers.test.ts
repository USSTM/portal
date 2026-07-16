import { describe, expect, it } from 'vitest'

import { normalizeOrganizingClubIds } from './event-organizers'

describe('normalizeOrganizingClubIds', () => {
  it('deduplicates additional Organizing Clubs while excluding the Owning Club', () => {
    expect(
      normalizeOrganizingClubIds('owner', [
        'club-a',
        'owner',
        'club-a',
        'club-b',
      ]),
    ).toEqual(['club-a', 'club-b'])
  })
})
