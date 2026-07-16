import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPortalIdentity } from '../../auth/identity.js'

import {
  browseResources,
  createResource,
  editResource,
  requireResourceAdministrationAuthority,
  requireResourceBrowseAuthority,
  setResourceActive,
} from './resources.js'

const resourceInput = z.object({
  category: z.enum(['finance', 'operations']),
  description: z.string().trim().min(1).max(1000),
  displayOrder: z.number().int().min(0).max(100_000),
  title: z.string().trim().min(1).max(200),
  url: z
    .string()
    .url()
    .refine((url) => url.startsWith('https://'), 'URL must use HTTPS'),
})

export const createResourceAction = createServerFn({ method: 'POST' })
  .inputValidator(resourceInput)
  .handler(async ({ data }) =>
    createResource({
      ...data,
      actorEmail: await requireResourceAdministrator(),
    }),
  )

export const editResourceAction = createServerFn({ method: 'POST' })
  .inputValidator(resourceInput.extend({ resourceId: z.string().uuid() }))
  .handler(async ({ data }) =>
    editResource({ ...data, actorEmail: await requireResourceAdministrator() }),
  )

export const setResourceActiveAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ active: z.boolean(), resourceId: z.string().uuid() }),
  )
  .handler(async ({ data }) =>
    setResourceActive({
      ...data,
      actorEmail: await requireResourceAdministrator(),
    }),
  )

export const getResourcesForAdministration = createServerFn({
  method: 'GET',
}).handler(async () => {
  requireResourceAdministrationAuthority(await getPortalIdentity())
  return browseResources()
})

export const getActiveResources = createServerFn({ method: 'GET' }).handler(
  async () => {
    requireResourceBrowseAuthority(await getPortalIdentity())
    return browseResources({ active: true })
  },
)

async function requireResourceAdministrator() {
  return requireResourceAdministrationAuthority(await getPortalIdentity())
}
