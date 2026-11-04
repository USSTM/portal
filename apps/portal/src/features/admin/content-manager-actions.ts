import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { resolvePortalIdentity } from '../../auth/identity.js'

import {
  grantContentManager,
  requireContentManagerAdministrationAuthority,
  revokeContentManager,
} from './content-managers.js'

const memberId = z.string().uuid()

export const grantContentManagerAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ memberId }))
  .handler(async ({ data }) =>
    grantContentManager({
      ...data,
      actorEmail: await requireContentManagerAdministrator(),
    }),
  )

export const revokeContentManagerAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ memberId }))
  .handler(async ({ data }) =>
    revokeContentManager({
      ...data,
      actorEmail: await requireContentManagerAdministrator(),
    }),
  )

async function requireContentManagerAdministrator() {
  return requireContentManagerAdministrationAuthority(
    await resolvePortalIdentity(),
  )
}
