import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPortalIdentity } from '../../auth/identity.js'

import {
  cancelOwnBooking,
  createOwnBooking,
  findBoardMemberId,
} from './bookings.js'
import { getOfficeHoursCalendar } from './calendar.js'

export const getOfficeHoursCalendarAction = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ week: z.string().optional() }))
  .handler(async ({ data }) => {
    const identity = await getPortalIdentity()
    const viewerMemberId =
      identity.kind === 'member'
        ? await findBoardMemberId(identity.email)
        : undefined
    return {
      ...(await getOfficeHoursCalendar({ ...data, viewerMemberId })),
      canManageBookings: viewerMemberId !== undefined,
    }
  })

export const createOwnBookingAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ date: z.string(), shiftSlotId: z.string().uuid() }),
  )
  .handler(async ({ data }) =>
    createOwnBooking({ ...data, actorEmail: await requireBoardMember() }),
  )

export const cancelOwnBookingAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ bookingId: z.string().uuid() }))
  .handler(async ({ data }) =>
    cancelOwnBooking({ ...data, actorEmail: await requireBoardMember() }),
  )

async function requireBoardMember() {
  const identity = await getPortalIdentity()
  if (
    identity.kind !== 'member' ||
    !(await findBoardMemberId(identity.email))
  ) {
    throw new Error('Board Member authority is required')
  }
  return identity.email
}
