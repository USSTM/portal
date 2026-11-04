import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { resolvePortalIdentity } from '../../auth/identity.js'

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
import { requireAdministratorManagementAuthority } from './authorization.js'

const memberId = z.string().uuid()
const clubIds = z.array(z.string().uuid())

export const createMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      administrator: z.boolean().optional(),
      clubIds,
      contentManager: z.boolean().optional(),
      displayName: z.string().trim().min(1).max(200),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) => {
    const identity = await resolvePortalIdentity()
    const actorEmail = data.administrator
      ? requireAdministratorManagementAuthority(identity)
      : requireMemberAdministrationAuthority(identity)
    return createMemberWithClubAccess({ ...data, actorEmail })
  })

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

export const grantClubAccessAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ clubId: memberId, memberId }))
  .handler(async ({ data }) =>
    grantClubAccess({
      ...data,
      actorEmail: await requireMemberAdministrator(),
    }),
  )

export const revokeClubAccessAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ clubId: memberId, memberId }))
  .handler(async ({ data }) =>
    revokeClubAccess({
      ...data,
      actorEmail: await requireMemberAdministrator(),
    }),
  )

export const deactivateMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ memberId }))
  .handler(async ({ data }) =>
    deactivateMember({
      ...data,
      actorEmail: await requireMemberAdministrator(),
    }),
  )

export const reactivateMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z
      .object({ clubIds, contentManager: z.boolean().optional(), memberId })
      .refine((data) => data.clubIds.length > 0 || data.contentManager, {
        message: 'At least one grant is required',
      }),
  )
  .handler(async ({ data }) =>
    reactivateMember({
      ...data,
      actorEmail: await requireMemberAdministrator(),
    }),
  )

export const getMembers = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      administratorOnly: z.boolean().optional(),
      clubId: memberId.optional(),
      includeAdministrators: z.boolean().optional(),
      lifecycle: z.enum(['active', 'deactivated']).optional(),
      search: z.string().trim().max(320).optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireMemberAdministrationAuthority(await resolvePortalIdentity())
    return browseMembers(data)
  })

async function requireMemberAdministrator() {
  return requireMemberAdministrationAuthority(await resolvePortalIdentity())
}
