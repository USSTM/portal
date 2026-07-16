import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  createEventAction,
  deleteEventAction,
  editEventAction,
  getEventCreationClubs,
  getEvents,
  getOrganizerClubs,
  overrideCreateEventAction,
  overrideDeleteEventAction,
  overrideEditEventAction,
  overrideReplaceEventOrganizersAction,
  replaceEventOrganizersAction,
} from '../features/events/event-actions'
import { eventEditInput, eventInput } from '../features/events/event-input'

const searchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  search: z.string().trim().max(100).optional(),
  view: z.enum(['past', 'upcoming']).catch('upcoming'),
})

export const Route = createFileRoute('/events')({
  component: Events,
  loader: async ({ deps }) => {
    const events = await getEvents({ data: deps })
    return {
      clubs: await getEventCreationClubs(),
      events,
      organizerClubs: await getOrganizerClubs(),
    }
  },
  loaderDeps: ({ search }) => searchSchema.parse(search),
  validateSearch: searchSchema,
})

function Events() {
  const { clubs, events, organizerClubs } = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()
  const createEvent = useServerFn(createEventAction)
  const overrideCreateEvent = useServerFn(overrideCreateEventAction)
  const editEvent = useServerFn(editEventAction)
  const overrideEditEvent = useServerFn(overrideEditEventAction)
  const deleteEvent = useServerFn(deleteEventAction)
  const overrideDeleteEvent = useServerFn(overrideDeleteEventAction)
  const replaceOrganizers = useServerFn(replaceEventOrganizersAction)
  const overrideReplaceOrganizers = useServerFn(
    overrideReplaceEventOrganizersAction,
  )
  const [error, setError] = useState<string>()

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = {
      address: String(form.get('address') ?? ''),
      description: String(form.get('description') ?? ''),
      endAt: String(form.get('endAt') ?? ''),
      location: String(form.get('location') ?? ''),
      owningClubId: String(form.get('owningClubId') ?? ''),
      startAt: String(form.get('startAt') ?? ''),
      title: String(form.get('title') ?? ''),
    }
    const parsed = eventInput.safeParse(input)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the Event details.')
      return
    }
    try {
      if (events.isPrivileged) await overrideCreateEvent({ data: input })
      else await createEvent({ data: input })
      event.currentTarget.reset()
      setError(undefined)
      await router.invalidate()
      toast.success('Event published.')
    } catch {
      setError(
        'Unable to publish the Event. Check your Club Access and try again.',
      )
    }
  }

  async function edit(
    event: React.FormEvent<HTMLFormElement>,
    eventId: string,
    updatedAt: Date,
  ) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = {
      address: String(form.get('address') ?? ''),
      description: String(form.get('description') ?? ''),
      endAt: String(form.get('endAt') ?? ''),
      eventId,
      location: String(form.get('location') ?? ''),
      startAt: String(form.get('startAt') ?? ''),
      title: String(form.get('title') ?? ''),
      updatedAt: updatedAt.toISOString(),
    }
    const parsed = eventEditInput.safeParse(input)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the Event details.')
      return
    }
    try {
      const owningClubId = String(form.get('owningClubId') ?? '')
      if (events.isPrivileged) {
        await overrideEditEvent({ data: { ...input, owningClubId } })
      } else {
        await editEvent({ data: input })
      }
      setError(undefined)
      await router.invalidate()
      toast.success('Event updated.')
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to update the Event.',
      )
    }
  }

  async function remove(eventId: string) {
    if (!window.confirm('Delete this Event? This cannot be undone.')) return
    try {
      if (events.isPrivileged) {
        await overrideDeleteEvent({ data: { confirmed: true, eventId } })
      } else {
        await deleteEvent({ data: { confirmed: true, eventId } })
      }
      setError(undefined)
      await router.invalidate()
      toast.success('Event deleted.')
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to delete the Event.',
      )
    }
  }

  async function saveOrganizers(
    event: React.FormEvent<HTMLFormElement>,
    eventId: string,
  ) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const data = {
        eventId,
        organizerClubIds: form.getAll('organizerClubIds').map(String),
      }
      if (events.isPrivileged) await overrideReplaceOrganizers({ data })
      else await replaceOrganizers({ data })
      await router.invalidate()
      toast.success('Organizing Clubs updated.')
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to update Organizing Clubs.',
      )
    }
  }

  const totalPages = Math.max(1, Math.ceil(events.total / events.pageSize))
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Events</p>
        <h1 className="text-3xl font-semibold tracking-tight">Club Events</h1>
        <p className="mt-1 text-muted-foreground">
          Choose the Owning Club explicitly when publishing an Event.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-lg border bg-card p-5 sm:grid-cols-2"
        onSubmit={create}
      >
        <h2 className="sm:col-span-2 font-medium">Publish Event</h2>
        <label className="grid gap-1">
          <span>Owning Club</span>
          <select name="owningClubId" required>
            <option value="">Select an authorized Club</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span>Title</span>
          <input maxLength={100} minLength={3} name="title" required />
        </label>
        <label className="grid gap-1">
          <span>Location</span>
          <input name="location" required />
        </label>
        <label className="grid gap-1">
          <span>Address or HTTPS URL</span>
          <input name="address" required />
        </label>
        <label className="grid gap-1">
          <span>Start (Toronto)</span>
          <input name="startAt" required type="datetime-local" />
        </label>
        <label className="grid gap-1">
          <span>End (Toronto)</span>
          <input name="endAt" required type="datetime-local" />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span>Description</span>
          <textarea
            maxLength={1000}
            minLength={10}
            name="description"
            required
            rows={4}
          />
        </label>
        {error ? (
          <p className="sm:col-span-2 text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <button className="sm:col-span-2" type="submit">
          Publish Event
        </button>
      </form>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {search.view === 'past' ? 'Past' : 'Upcoming'} Events
            </h2>
            <p className="text-sm text-muted-foreground">
              {events.total} matching Events
            </p>
          </div>
          <form className="flex flex-wrap gap-2" method="get">
            <input
              defaultValue={search.search}
              name="search"
              placeholder="Search Events and Clubs"
            />
            <input name="view" type="hidden" value={search.view} />
            <button type="submit">Search</button>
          </form>
        </div>
        <div className="flex gap-2">
          <Link
            search={{ page: 1, search: search.search, view: 'upcoming' }}
            to="/events"
          >
            Upcoming
          </Link>
          <Link
            search={{ page: 1, search: search.search, view: 'past' }}
            to="/events"
          >
            Past
          </Link>
        </div>
        <ul className="space-y-3">
          {events.entries.map((event) => (
            <li className="rounded-lg border bg-card p-5" key={event.id}>
              <p className="text-sm font-medium text-muted-foreground">
                Owning Club · {event.owningClubName}
              </p>
              {event.organizingClubs.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Organizing Clubs ·{' '}
                  {event.organizingClubs
                    .map((club) => club.fullName)
                    .join(', ')}
                </p>
              ) : null}
              <h3 className="mt-1 text-lg font-medium">{event.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {event.description}
              </p>
              <p className="mt-3 text-sm">
                {event.location} · {event.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatToronto(event.startAt)} – {formatToronto(event.endAt)}
              </p>
              {events.isPrivileged ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Created by {event.creatorDisplayName ?? 'Unknown'} · Last
                  edited by {event.editorDisplayName ?? 'Unknown'}
                </p>
              ) : null}
              {(events.isPrivileged || event.canManage) &&
              (events.isPrivileged || event.endAt > new Date()) ? (
                <details className="mt-3">
                  <summary>Edit Event</summary>
                  <form
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                    onSubmit={(submitted) =>
                      edit(submitted, event.id, event.updatedAt)
                    }
                  >
                    {events.isPrivileged ? (
                      <select
                        className="sm:col-span-2"
                        defaultValue={event.owningClubId}
                        name="owningClubId"
                        required
                      >
                        {clubs.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.fullName}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <input defaultValue={event.title} name="title" required />
                    <input
                      defaultValue={event.location}
                      name="location"
                      required
                    />
                    <input
                      defaultValue={event.address}
                      name="address"
                      required
                    />
                    <input
                      defaultValue={toTorontoLocalInput(event.startAt)}
                      name="startAt"
                      required
                      type="datetime-local"
                    />
                    <input
                      defaultValue={toTorontoLocalInput(event.endAt)}
                      name="endAt"
                      required
                      type="datetime-local"
                    />
                    <textarea
                      className="sm:col-span-2"
                      defaultValue={event.description}
                      name="description"
                      required
                      rows={4}
                    />
                    <button className="sm:col-span-2" type="submit">
                      Save Event
                    </button>
                  </form>
                </details>
              ) : null}
              {(events.isPrivileged || event.canManage) &&
              (events.isPrivileged || event.endAt > new Date()) ? (
                <details className="mt-3">
                  <summary>Organizing Clubs</summary>
                  <form
                    className="mt-3 space-y-2"
                    onSubmit={(submitted) =>
                      saveOrganizers(submitted, event.id)
                    }
                  >
                    {organizerClubs
                      .filter((club) => club.id !== event.owningClubId)
                      .map((club) => (
                        <label className="mr-4" key={club.id}>
                          <input
                            defaultChecked={event.organizingClubs.some(
                              (organizer) => organizer.id === club.id,
                            )}
                            name="organizerClubIds"
                            type="checkbox"
                            value={club.id}
                          />{' '}
                          {club.fullName}
                        </label>
                      ))}
                    <button type="submit">Save Organizing Clubs</button>
                  </form>
                </details>
              ) : null}
              {(events.isPrivileged || event.canManage) &&
              event.startAt > new Date() ? (
                <button
                  className="mt-3"
                  onClick={() => remove(event.id)}
                  type="button"
                >
                  Delete Event
                </button>
              ) : null}
            </li>
          ))}
          {events.entries.length === 0 ? (
            <li className="text-muted-foreground">No Events found.</li>
          ) : null}
        </ul>
        <nav aria-label="Event pages" className="flex items-center gap-3">
          {events.page > 1 ? (
            <Link search={{ ...search, page: events.page - 1 }} to="/events">
              Previous
            </Link>
          ) : null}
          <span className="text-sm text-muted-foreground">
            Page {events.page} of {totalPages}
          </span>
          {events.page < totalPages ? (
            <Link search={{ ...search, page: events.page + 1 }} to="/events">
              Next
            </Link>
          ) : null}
        </nav>
      </section>
    </main>
  )
}

function toTorontoLocalInput(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'America/Toronto',
    year: 'numeric',
  })
    .formatToParts(value)
    .filter((part) => part.type !== 'literal')
    .reduce<Record<string, string>>(
      (result, part) => ({ ...result, [part.type]: part.value }),
      {},
    )
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function formatToronto(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Toronto',
  }).format(value)
}
