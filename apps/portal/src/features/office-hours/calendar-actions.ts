import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPortalIdentity } from '../../auth/identity.js'

import {
  cancelOwnBooking,
  cancelOverrideBooking,
  createOwnBooking,
  createOverrideBooking,
  findBoardMemberId,
  listActiveBoardMembers,
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
    const canOverride =
      identity.kind === 'administrator' || identity.kind === 'superuser'
    return {
      ...(await getOfficeHoursCalendar({
        ...data,
        viewerCanOverride: canOverride,
        viewerMemberId,
      })),
      canManageBookings: viewerMemberId !== undefined,
      canOverrideBookings: canOverride,
      overrideMembers: canOverride ? await listActiveBoardMembers() : [],
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

export const createOverrideBookingAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      date: z.string(),
      memberId: z.string().uuid(),
      shiftSlotId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) =>
    createOverrideBooking({
      ...data,
      actorEmail: await requireBookingAdministrator(),
    }),
  )

export const cancelOverrideBookingAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ bookingId: z.string().uuid() }))
  .handler(async ({ data }) =>
    cancelOverrideBooking({
      ...data,
      actorEmail: await requireBookingAdministrator(),
    }),
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

async function requireBookingAdministrator() {
  const identity = await getPortalIdentity()
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return identity.email
  }
  throw new Error('Administrator authority is required')
}
