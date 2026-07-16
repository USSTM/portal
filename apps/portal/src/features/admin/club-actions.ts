import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPortalIdentity } from '../../auth/identity.js'

import {
  archiveClub,
  browseClubs,
  createClub,
  editClub,
  reactivateClub,
  requireClubAdministrationAuthority,
} from './clubs.js'

const clubInput = z.object({
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((email) => email || undefined)
    .pipe(z.string().email().optional()),
  fullName: z.string().trim().min(1).max(200),
  shortName: z.string().trim().min(1).max(100),
})

const clubIdInput = z.object({ clubId: z.string().uuid() })

export const createClubAction = createServerFn({ method: 'POST' })
  .inputValidator(clubInput)
  .handler(async ({ data }) =>
    createClub({ ...data, actorEmail: await requireClubAdministrator() }),
  )

export const editClubAction = createServerFn({ method: 'POST' })
  .inputValidator(clubInput.extend({ clubId: z.string().uuid() }))
  .handler(async ({ data }) =>
    editClub({ ...data, actorEmail: await requireClubAdministrator() }),
  )

export const archiveClubAction = clubLifecycleAction(archiveClub)
export const reactivateClubAction = clubLifecycleAction(reactivateClub)

export const getClubs = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      lifecycle: z.enum(['active', 'archived']).optional(),
      search: z.string().trim().max(100).optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireClubAdministrationAuthority(await getPortalIdentity())
    return browseClubs(data)
  })

function clubLifecycleAction(
  action: (input: { actorEmail: string; clubId: string }) => Promise<void>,
) {
  return createServerFn({ method: 'POST' })
    .inputValidator(clubIdInput)
    .handler(async ({ data }) => action({ ...data, actorEmail: await requireClubAdministrator() }))
}

async function requireClubAdministrator() {
  return requireClubAdministrationAuthority(await getPortalIdentity())
}
