import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPortalIdentity } from '../../auth/identity.js'

import {
  browseMembers,
  createMemberWithClubAccess,
  deactivateMember,
  editMember,
  grantClubAccess,
  reactivateMember,
  requireMemberAdministrationAuthority,
  revokeClubAccess,
} from './members.js'

const memberId = z.string().uuid()
const clubIds = z.array(z.string().uuid()).min(1)

export const createMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clubIds,
      displayName: z.string().trim().min(1).max(200),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) =>
    createMemberWithClubAccess({ ...data, actorEmail: await requireMemberAdministrator() }),
  )

export const editMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      confirmed: z.boolean(),
      displayName: z.string().trim().min(1).max(200),
      email: z.string().email(),
      memberId,
    }),
  )
  .handler(async ({ data }) =>
    editMember({ ...data, actorEmail: await requireMemberAdministrator() }),
  )

export const grantClubAccessAction = clubAccessAction(grantClubAccess)
export const revokeClubAccessAction = clubAccessAction(revokeClubAccess)

export const deactivateMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ memberId }))
  .handler(async ({ data }) =>
    deactivateMember({ ...data, actorEmail: await requireMemberAdministrator() }),
  )

export const reactivateMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ clubIds, memberId }))
  .handler(async ({ data }) =>
    reactivateMember({ ...data, actorEmail: await requireMemberAdministrator() }),
  )

export const getMembers = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      clubId: memberId.optional(),
      lifecycle: z.enum(['active', 'deactivated']).optional(),
      search: z.string().trim().max(320).optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireMemberAdministrationAuthority(await getPortalIdentity())
    return browseMembers(data)
  })

function clubAccessAction(
  action: (input: { actorEmail: string; clubId: string; memberId: string }) => Promise<void>,
) {
  return createServerFn({ method: 'POST' })
    .inputValidator(z.object({ clubId: memberId, memberId }))
    .handler(async ({ data }) => action({ ...data, actorEmail: await requireMemberAdministrator() }))
}

async function requireMemberAdministrator() {
  return requireMemberAdministrationAuthority(await getPortalIdentity())
}
