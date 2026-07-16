import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPortalIdentity } from '../../auth/identity.js'
import {
  createAdministrator,
  deactivateAdministrator,
  editAdministrator,
  grantAdministrator,
  reactivateAdministrator,
  revokeAdministrator,
} from './administrators.js'
import { requireAdministratorManagementAuthority } from './authorization.js'

const administratorInput = z.object({ memberId: z.string().uuid() })

export const createAdministratorAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      displayName: z.string().trim().min(1).max(200),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) =>
    createAdministrator({ ...data, actorEmail: await requireSuperuser() }),
  )

export const editAdministratorAction = createServerFn({ method: 'POST' })
  .inputValidator(
    administratorInput.extend({
      displayName: z.string().trim().min(1).max(200),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) =>
    editAdministrator({ ...data, actorEmail: await requireSuperuser() }),
  )

export const deactivateAdministratorAction = actionFor(deactivateAdministrator)
export const reactivateAdministratorAction = actionFor(reactivateAdministrator)
export const grantAdministratorAction = actionFor(grantAdministrator)
export const revokeAdministratorAction = actionFor(revokeAdministrator)

function actionFor(
  action: (input: { actorEmail: string; memberId: string }) => Promise<void>,
) {
  return createServerFn({ method: 'POST' })
    .inputValidator(administratorInput)
    .handler(async ({ data }) => action({ ...data, actorEmail: await requireSuperuser() }))
}

async function requireSuperuser() {
  const identity = await getPortalIdentity()
  return requireAdministratorManagementAuthority(identity)
}
