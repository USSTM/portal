import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { resolvePortalIdentity } from '../../auth/identity.js'
import {
  deactivateAdministrator,
  editAdministrator,
  grantAdministrator,
  grantBoardPositionToAdministrator,
  grantClubAccessToAdministrator,
  reactivateAdministrator,
  revokeAdministrator,
  revokeBoardPositionFromAdministrator,
  revokeClubAccessFromAdministrator,
  updateAdministratorBoardPosition,
} from './administrators.js'
import { requireAdministratorManagementAuthority } from './authorization.js'

const administratorInput = z.object({ memberId: z.string().uuid() })
const boardPosition = z.string().trim().min(1).max(200)

export const editAdministratorAction = createServerFn({ method: 'POST' })
  .inputValidator(
    administratorInput.extend({
      confirmed: z.boolean(),
      displayName: z.string().trim().min(1).max(200),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) =>
    editAdministrator({ ...data, actorEmail: await requireSuperuser() }),
  )

export const deactivateAdministratorAction = createServerFn({ method: 'POST' })
  .inputValidator(administratorInput)
  .handler(async ({ data }) =>
    deactivateAdministrator({ ...data, actorEmail: await requireSuperuser() }),
  )

export const grantAdministratorAction = createServerFn({ method: 'POST' })
  .inputValidator(administratorInput)
  .handler(async ({ data }) =>
    grantAdministrator({ ...data, actorEmail: await requireSuperuser() }),
  )

export const revokeAdministratorAction = createServerFn({ method: 'POST' })
  .inputValidator(administratorInput)
  .handler(async ({ data }) =>
    revokeAdministrator({ ...data, actorEmail: await requireSuperuser() }),
  )

export const revokeBoardPositionFromAdministratorAction = createServerFn({
  method: 'POST',
})
  .inputValidator(administratorInput)
  .handler(async ({ data }) =>
    revokeBoardPositionFromAdministrator({
      ...data,
      actorEmail: await requireSuperuser(),
    }),
  )

export const reactivateAdministratorAction = createServerFn({ method: 'POST' })
  .inputValidator(
    administratorInput.extend({
      administrator: z.boolean(),
      clubIds: z.array(z.string().uuid()),
    }),
  )
  .handler(async ({ data }) =>
    reactivateAdministrator({ ...data, actorEmail: await requireSuperuser() }),
  )

export const grantClubAccessToAdministratorAction = createServerFn({
  method: 'POST',
})
  .inputValidator(administratorInput.extend({ clubId: z.string().uuid() }))
  .handler(async ({ data }) =>
    grantClubAccessToAdministrator({
      ...data,
      actorEmail: await requireSuperuser(),
    }),
  )

export const revokeClubAccessFromAdministratorAction = createServerFn({
  method: 'POST',
})
  .inputValidator(administratorInput.extend({ clubId: z.string().uuid() }))
  .handler(async ({ data }) =>
    revokeClubAccessFromAdministrator({
      ...data,
      actorEmail: await requireSuperuser(),
    }),
  )

export const grantBoardPositionToAdministratorAction = createServerFn({
  method: 'POST',
})
  .inputValidator(administratorInput.extend({ boardPosition }))
  .handler(async ({ data }) =>
    grantBoardPositionToAdministrator({
      ...data,
      actorEmail: await requireSuperuser(),
    }),
  )

export const updateAdministratorBoardPositionAction = createServerFn({
  method: 'POST',
})
  .inputValidator(
    administratorInput.extend({
      boardPosition,
      displayName: z.string().trim().min(1).max(200),
    }),
  )
  .handler(async ({ data }) =>
    updateAdministratorBoardPosition({
      ...data,
      actorEmail: await requireSuperuser(),
    }),
  )

async function requireSuperuser() {
  const identity = await resolvePortalIdentity()
  return requireAdministratorManagementAuthority(identity)
}
