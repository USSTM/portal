import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { resolvePortalIdentity } from '../../auth/identity.js'
import {
  cancelRoomBBooking,
  createRoomBBooking,
  getRoomBBookingContext,
  overwriteRoomBBooking,
} from './bookings.js'
import { getRoomBCalendar } from './calendar.js'
import { getRoomBSchedule } from './schedule.js'
import {
  roomBBookingInput,
  roomBDateSchema,
  roomBOverwriteInput,
} from './policy.js'

import type { PortalIdentity } from '../../auth/access.js'

const weekInput = z.object({ week: roomBDateSchema.optional() })
const scheduleInput = z.object({
  date: roomBDateSchema.optional(),
  view: z.enum(['day', 'week', 'month']).optional(),
})

// Only the schedule projection is public; booking context and mutations
// continue to require an active portal identity.
export const getPublicRoomBScheduleAction = createServerFn({ method: 'GET' })
  .validator(scheduleInput)
  .handler(({ data }) => getRoomBSchedule(data))

export const getRoomBScheduleAction = createServerFn({ method: 'GET' })
  .validator(scheduleInput)
  .handler(async ({ data }) => {
    requireRoomBIdentity(await resolvePortalIdentity())
    return getRoomBSchedule(data)
  })

export const getRoomBCalendarAction = createServerFn({ method: 'GET' })
  .validator(weekInput)
  .handler(async ({ data }) => {
    requireRoomBIdentity(await resolvePortalIdentity())
    return getRoomBCalendar(data)
  })

export const getRoomBBookingContextAction = createServerFn({ method: 'GET' })
  .validator(weekInput)
  .handler(async ({ data }) =>
    getRoomBBookingContext({
      ...data,
      actorEmail: requireRoomBIdentity(await resolvePortalIdentity()),
    }),
  )

export const createRoomBBookingAction = createServerFn({ method: 'POST' })
  .validator(roomBBookingInput)
  .handler(async ({ data }) =>
    createRoomBBooking({
      ...data,
      actorEmail: requireRoomBIdentity(await resolvePortalIdentity()),
    }),
  )

export const cancelRoomBBookingAction = createServerFn({ method: 'POST' })
  .validator(z.object({ bookingId: z.uuid() }))
  .handler(async ({ data }) =>
    cancelRoomBBooking({
      ...data,
      actorEmail: requireRoomBIdentity(await resolvePortalIdentity()),
    }),
  )

export const overwriteRoomBBookingAction = createServerFn({ method: 'POST' })
  .validator(roomBOverwriteInput)
  .handler(async ({ data }) =>
    overwriteRoomBBooking({
      ...data,
      actorEmail: requireRoomBIdentity(await resolvePortalIdentity()),
    }),
  )

export function requireRoomBIdentity(identity: PortalIdentity) {
  if (identity.kind === 'anonymous' || identity.kind === 'denied')
    throw new Error('Sign in with an active Member identity')
  // Recheck the active Member and current database grants in the domain
  // operation; never infer Room B privileges from a title or browser input.
  return identity.email
}
