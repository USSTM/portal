import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { resolvePortalIdentity } from '../../auth/identity.js'

import {
  createBoardArchive,
  listPublicBoardArchives,
  requireBoardArchiveAuthority,
} from './board-archives.js'

export const getBoardArchives = createServerFn({ method: 'GET' }).handler(
  async () => {
    requireBoardArchiveAuthority(await resolvePortalIdentity())
    return listPublicBoardArchives()
  },
)

export const createBoardArchiveAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ academicYear: z.string().trim().min(1).max(20) }))
  .handler(async ({ data }) =>
    createBoardArchive({
      academicYear: data.academicYear,
      actorEmail: requireBoardArchiveAuthority(await resolvePortalIdentity()),
    }),
  )
