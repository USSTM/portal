import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getPortalShell } from '../auth/shell'
import { AccessDenied, SignIn } from '../components/auth-state'
import {
  cancelRoomBBookingAction,
  createRoomBBookingAction,
  getRoomBBookingContextAction,
  getRoomBScheduleAction,
  overwriteRoomBBookingAction,
} from '../features/room-b/actions'
import { RoomBScheduleBrowser } from '../features/room-b/schedule-browser'

import type { getRoomBBookingContext } from '../features/room-b/bookings'

const searchSchema = z.object({
  week: z.string().optional(),
  date: z.string().optional(),
  view: z.enum(['day', 'week', 'month']).optional(),
})

export const Route = createFileRoute('/room-b')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => searchSchema.parse(search),
  loader: async ({ deps }) => {
    const shell = await getPortalShell()
    if (shell.kind === 'anonymous') return { kind: 'anonymous' } as const
    if (shell.kind === 'denied') return { kind: 'denied' } as const
    const calendar = await getRoomBScheduleAction({
      data: { date: deps.date ?? deps.week, view: deps.view },
    })
    let bookingContext: Awaited<
      ReturnType<typeof getRoomBBookingContext>
    > | null = null
    let contextUnavailable = false
    try {
      bookingContext = await getRoomBBookingContextAction({
        data: { week: calendar.week },
      })
    } catch {
      // Authenticated calendar viewing does not require booking authority.
      contextUnavailable = true
    }
    return {
      kind: 'authenticated' as const,
      date: calendar.date,
      requestedView: deps.view,
      calendar,
      bookingContext,
      contextUnavailable,
      initialNow: new Date().toISOString(),
    }
  },
  component: RoomB,
  pendingComponent: () => (
    <main className="mx-auto max-w-[1600px] px-4 py-12">
      <p role="status" className="text-muted-foreground">
        Loading EPH 442B Room Booking…
      </p>
    </main>
  ),
  errorComponent: RoomBError,
  head: () => ({ meta: [{ title: 'EPH 442B Room Booking | USSTM Portal' }] }),
})

function RoomB() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const create = useServerFn(createRoomBBookingAction)
  const cancel = useServerFn(cancelRoomBBookingAction)
  const overwrite = useServerFn(overwriteRoomBBookingAction)
  if (data.kind === 'anonymous') return <SignIn />
  if (data.kind === 'denied') return <AccessDenied />
  return (
    <RoomBScheduleBrowser
      {...data}
      onNavigate={(date, view) => {
        void router.navigate({ to: '/room-b', search: { date, view } })
      }}
      onBook={(input) => create({ data: input })}
      onCancel={(bookingId) => cancel({ data: { bookingId } })}
      onOverwrite={(input) => overwrite({ data: input })}
      onRefresh={() => router.invalidate()}
    />
  )
}

function RoomBError() {
  const router = useRouter()
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <h1 className="text-3xl font-bold">EPH 442B Room Booking</h1>
      <p role="alert" className="text-muted-foreground">
        The EPH 442B calendar could not be loaded. Please try again.
      </p>
      <button
        type="button"
        onClick={() => void router.invalidate()}
        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
      >
        Try again
      </button>
      <a href="/" className="ml-4 text-sm text-primary hover:underline">
        Back to portal
      </a>
    </main>
  )
}
