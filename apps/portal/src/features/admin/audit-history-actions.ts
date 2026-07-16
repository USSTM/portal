import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPortalIdentity } from '../../auth/identity.js'

import { browseAuditHistory, requireAuditHistoryAuthority } from './audit-history.js'

const auditHistoryInput = z.object({
  action: z.string().trim().max(100).optional(),
  actorEmail: z.string().trim().max(320).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(25),
})

export const getAuditHistory = createServerFn({ method: 'GET' })
  .inputValidator(auditHistoryInput)
  .handler(async ({ data }) => {
    requireAuditHistoryAuthority(await getPortalIdentity())
    return browseAuditHistory(data)
  })
