import { createFileRoute, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { getPublicRoomBScheduleAction } from '../features/room-b/actions'
import { RoomBScheduleBrowser } from '../features/room-b/schedule-browser'

const searchSchema = z.object({
  date: z.string().optional(),
  view: z.enum(['day', 'week', 'month']).optional(),
})

// The trailing underscore in the filename keeps this public page outside the
// signed-in /room-b route's layout and loader.
export const Route = createFileRoute('/room-b_/calendar')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => searchSchema.parse(search),
  loader: async ({ deps }) => ({
    calendar: await getPublicRoomBScheduleAction({ data: deps }),
    requestedView: deps.view,
    initialNow: new Date().toISOString(),
  }),
  component: PublicRoomBCalendar,
  pendingComponent: () => (
    <p role="status" className="p-8 text-muted-foreground">
      Loading EPH 442B calendar…
    </p>
  ),
  errorComponent: PublicRoomBCalendarError,
  head: () => ({ meta: [{ title: 'EPH 442B Room Calendar | USSTM Portal' }] }),
})

function PublicRoomBCalendar() {
  const data = Route.useLoaderData()
  const router = useRouter()
  return (
    <RoomBScheduleBrowser
      {...data}
      date={data.calendar.date}
      bookingContext={null}
      readOnly
      onNavigate={(date, view) => {
        void router.navigate({ to: '/room-b/calendar', search: { date, view } })
      }}
      onRefresh={() => router.invalidate()}
    />
  )
}

function PublicRoomBCalendarError() {
  const router = useRouter()
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <h1 className="text-3xl font-bold">EPH 442B Room Calendar</h1>
      <p role="alert">The calendar could not be loaded. Please try again.</p>
      <button
        type="button"
        className="rounded-lg border border-border bg-card px-4 py-2"
        onClick={() => void router.invalidate()}
      >
        Try again
      </button>
      <a href="/" className="ml-4 text-primary hover:underline">
        Back to portal
      </a>
    </main>
  )
}
