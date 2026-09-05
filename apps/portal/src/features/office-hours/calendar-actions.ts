import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import type { PortalIdentity } from '../../auth/access.js'
import { resolvePortalIdentity } from '../../auth/identity.js'

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
    const identity = await resolvePortalIdentity()
    const viewerMemberId = await boardMemberIdForIdentity(identity)
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
    createOwnBooking({
      ...data,
      actorEmail: await requireBoardMember(await resolvePortalIdentity()),
    }),
  )

export const cancelOwnBookingAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ bookingId: z.string().uuid() }))
  .handler(async ({ data }) =>
    cancelOwnBooking({
      ...data,
      actorEmail: await requireBoardMember(await resolvePortalIdentity()),
    }),
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
      actorEmail: requireBookingAdministrator(await resolvePortalIdentity()),
    }),
  )

export const cancelOverrideBookingAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ bookingId: z.string().uuid() }))
  .handler(async ({ data }) =>
    cancelOverrideBooking({
      ...data,
      actorEmail: requireBookingAdministrator(await resolvePortalIdentity()),
    }),
  )

/**
 * A Member's Board Member authority does not depend on their highest
 * identity kind: an Administrator or the Superuser may also hold Board
 * Member authority and must still resolve to their own booking eligibility.
 */
export async function boardMemberIdForIdentity(identity: PortalIdentity) {
  if (identity.kind === 'anonymous' || identity.kind === 'denied') {
    return undefined
  }
  return findBoardMemberId(identity.email)
}

export async function requireBoardMember(identity: PortalIdentity) {
  if (
    identity.kind === 'anonymous' ||
    identity.kind === 'denied' ||
    !(await boardMemberIdForIdentity(identity))
  ) {
    throw new Error('Board Member authority is required')
  }
  return identity.email
}

export function requireBookingAdministrator(identity: PortalIdentity) {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return identity.email
  }
  throw new Error('Administrator authority is required')
}
