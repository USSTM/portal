import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { resolvePortalIdentity } from '../../auth/identity.js'

import {
  listBoardPositionOrder,
  requireBoardOrderAuthority,
  setBoardPositionOrder,
} from './public-board.js'

export const getBoardPositionOrder = createServerFn({ method: 'GET' }).handler(
  async () => {
    requireBoardOrderAuthority(await resolvePortalIdentity())
    return listBoardPositionOrder()
  },
)

export const setBoardPositionOrderAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      positions: z.array(z.string().trim().min(1).max(200)).max(100),
    }),
  )
  .handler(async ({ data }) => {
    requireBoardOrderAuthority(await resolvePortalIdentity())
    await setBoardPositionOrder(data.positions)
  })
