import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPortalIdentity } from '../../auth/identity.js'

import {
  createMemberWithBoardAuthority,
  browseBoardMembers,
  grantBoardAuthority,
  requireBoardMemberAdministrationAuthority,
  revokeBoardAuthority,
  updateBoardMember,
} from './board-members.js'

const memberId = z.string().uuid()
const boardPosition = z.string().trim().min(1).max(200)

export const createBoardMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      boardPosition,
      displayName: z.string().trim().min(1).max(200),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) =>
    createMemberWithBoardAuthority({ ...data, actorEmail: await requireBoardAdministrator() }),
  )

export const grantBoardAuthorityAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ boardPosition, memberId }))
  .handler(async ({ data }) =>
    grantBoardAuthority({ ...data, actorEmail: await requireBoardAdministrator() }),
  )

export const updateBoardMemberAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ boardPosition, displayName: z.string().trim().min(1).max(200), memberId }))
  .handler(async ({ data }) =>
    updateBoardMember({ ...data, actorEmail: await requireBoardAdministrator() }),
  )

export const revokeBoardAuthorityAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ memberId }))
  .handler(async ({ data }) =>
    revokeBoardAuthority({ ...data, actorEmail: await requireBoardAdministrator() }),
  )

export const getBoardMembers = createServerFn({ method: 'GET' }).handler(async () => {
  requireBoardMemberAdministrationAuthority(await getPortalIdentity())
  return browseBoardMembers()
})

async function requireBoardAdministrator() {
  return requireBoardMemberAdministrationAuthority(await getPortalIdentity())
}
