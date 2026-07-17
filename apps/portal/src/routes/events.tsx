import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Users,
  ChevronDown,
} from 'lucide-react'

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
    const formElement = event.currentTarget
    const form = new FormData(formElement)
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
      const message =
        parsed.error.issues[0]?.message ?? 'Check the Event details.'
      setError(message)
      toast.error(message)
      return
    }
    try {
      if (events.isPrivileged) await overrideCreateEvent({ data: input })
      else await createEvent({ data: input })
      formElement.reset()
      setError(undefined)
      await router.invalidate()
      toast.success('Event published.')
      // close the details element
      formElement.closest('details')?.removeAttribute('open')
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'Unable to publish the Event. Try again.'
      setError(message)
      toast.error(message)
    }
  }

  async function edit(
    event: React.FormEvent<HTMLFormElement>,
    eventId: string,
    updatedAt: Date,
  ) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
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
      formElement.closest('details')?.removeAttribute('open')
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
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      const data = {
        eventId,
        organizerClubIds: form.getAll('organizerClubIds').map(String),
      }
      if (events.isPrivileged) await overrideReplaceOrganizers({ data })
      else await replaceOrganizers({ data })
      await router.invalidate()
      toast.success('Organizing Clubs updated.')
      formElement.closest('details')?.removeAttribute('open')
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
    <>
      {/* Search and Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Events
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <form method="get" className="relative w-full sm:w-80 flex">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              defaultValue={search.search}
              name="search"
              placeholder="Search Events and Clubs..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
            />
            <input name="view" type="hidden" value={search.view} />
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>

          {/* Publish Event Toggle */}
          <details className="w-full sm:w-auto group">
            <summary className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer list-none">
              <Plus className="w-5 h-5" />
              Create Event
            </summary>
            <div className="absolute z-50 left-4 right-4 md:left-auto md:right-8 mt-2 w-auto md:w-[600px] bg-card border border-border rounded-xl shadow-xl p-6">
              <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
                <h2 className="sm:col-span-2 font-semibold text-lg">
                  Publish Event
                </h2>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Owning Club
                  </span>
                  <div className="relative">
                    <select
                      name="owningClubId"
                      required
                      className="h-9 w-full appearance-none rounded-md border border-input bg-transparent pl-3 pr-8 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select an authorized Club</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.fullName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Title
                  </span>
                  <input
                    maxLength={100}
                    minLength={3}
                    name="title"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Location
                  </span>
                  <input
                    name="location"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Address or HTTPS URL
                  </span>
                  <input
                    name="address"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Start (Toronto)
                  </span>
                  <input
                    name="startAt"
                    required
                    type="datetime-local"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    End (Toronto)
                  </span>
                  <input
                    name="endAt"
                    required
                    type="datetime-local"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Description
                  </span>
                  <textarea
                    maxLength={1000}
                    minLength={10}
                    name="description"
                    required
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                {error ? (
                  <p
                    className="sm:col-span-2 text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
                    type="submit"
                  >
                    Publish Event
                  </button>
                </div>
              </form>
            </div>
          </details>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6 flex gap-6">
        <Link
          search={{ page: 1, search: search.search, view: 'upcoming' }}
          to="/events"
          className={`pb-3 border-b-2 text-sm font-medium transition-colors ${search.view !== 'past' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Upcoming
        </Link>
        <Link
          search={{ page: 1, search: search.search, view: 'past' }}
          to="/events"
          className={`pb-3 border-b-2 text-sm font-medium transition-colors ${search.view === 'past' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Past
        </Link>
      </div>

      {/* Event Cards */}
      <ul className="flex flex-col gap-4 mb-8">
        {events.entries.map((event) => (
          <li
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:bg-secondary/20 transition-colors group"
            key={event.id}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-xl font-semibold text-foreground tracking-tight">
                    {event.title}
                  </h2>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
                    {event.owningClubName}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {event.description}
                </p>
              </div>

              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {(events.isPrivileged || event.canManage) &&
                (events.isPrivileged || event.endAt > new Date()) ? (
                  <details className="relative">
                    <summary
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer list-none"
                      title="Edit Event"
                    >
                      <Edit className="w-5 h-5" />
                    </summary>
                    <div className="absolute right-0 mt-2 z-20 w-[300px] sm:w-[400px] bg-card border border-border rounded-xl shadow-xl p-4">
                      <h3 className="font-semibold mb-3">Edit Event</h3>
                      <form
                        className="grid gap-3"
                        onSubmit={(submitted) =>
                          edit(submitted, event.id, event.updatedAt)
                        }
                      >
                        {events.isPrivileged ? (
                          <div className="relative">
                            <select
                              className="h-9 w-full appearance-none rounded-md border border-input bg-transparent pl-3 pr-8 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        ) : null}
                        <input
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          defaultValue={event.title}
                          name="title"
                          placeholder="Title"
                          required
                        />
                        <input
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          defaultValue={event.location}
                          name="location"
                          placeholder="Location"
                          required
                        />
                        <input
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          defaultValue={event.address}
                          name="address"
                          placeholder="Address/URL"
                          required
                        />
                        <div className="flex gap-2">
                          <input
                            className="h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            defaultValue={toTorontoLocalInput(event.startAt)}
                            name="startAt"
                            required
                            type="datetime-local"
                            title="Start"
                          />
                          <input
                            className="h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            defaultValue={toTorontoLocalInput(event.endAt)}
                            name="endAt"
                            required
                            type="datetime-local"
                            title="End"
                          />
                        </div>
                        <textarea
                          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          defaultValue={event.description}
                          name="description"
                          placeholder="Description"
                          required
                          rows={3}
                        />
                        <button
                          className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                          type="submit"
                        >
                          Save Changes
                        </button>
                      </form>
                    </div>
                  </details>
                ) : null}

                {(events.isPrivileged || event.canManage) &&
                (events.isPrivileged || event.endAt > new Date()) ? (
                  <details className="relative">
                    <summary
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer list-none"
                      title="Organizers"
                    >
                      <Users className="w-5 h-5" />
                    </summary>
                    <div className="absolute right-0 mt-2 z-20 w-[250px] bg-card border border-border rounded-xl shadow-xl p-4">
                      <h3 className="font-semibold mb-3">Organizing Clubs</h3>
                      <form
                        className="space-y-2 max-h-[200px] overflow-y-auto"
                        onSubmit={(submitted) =>
                          saveOrganizers(submitted, event.id)
                        }
                      >
                        {organizerClubs
                          .filter((club) => club.id !== event.owningClubId)
                          .map((club) => (
                            <label
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-1 rounded"
                              key={club.id}
                            >
                              <input
                                defaultChecked={event.organizingClubs.some(
                                  (organizer) => organizer.id === club.id,
                                )}
                                name="organizerClubIds"
                                type="checkbox"
                                value={club.id}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              {club.fullName}
                            </label>
                          ))}
                        <button
                          className="w-full mt-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                          type="submit"
                        >
                          Save Organizers
                        </button>
                      </form>
                    </div>
                  </details>
                ) : null}

                {(events.isPrivileged || event.canManage) &&
                event.startAt > new Date() ? (
                  <button
                    className="p-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    onClick={() => remove(event.id)}
                    type="button"
                    title="Delete Event"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-4 border-t border-border/50 pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5 text-primary/70" />
                <span className="text-sm font-medium text-foreground/80">
                  {formatToronto(event.startAt)} – {formatToronto(event.endAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary/70" />
                <span className="text-sm font-medium text-foreground/80">
                  {event.location} · {event.address}
                </span>
              </div>
            </div>

            {event.organizingClubs.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="text-xs text-muted-foreground mr-1">
                  Organized by:
                </span>
                {event.organizingClubs.map((club) => (
                  <span
                    key={club.id}
                    className="bg-secondary/50 border border-border text-foreground px-2 py-0.5 rounded-full text-xs font-medium"
                  >
                    {club.fullName}
                  </span>
                ))}
              </div>
            )}

            {events.isPrivileged ? (
              <p className="mt-2 text-xs text-muted-foreground/60 border-t border-border/20 pt-2">
                Created by {event.creatorDisplayName ?? 'Unknown'} · Last edited
                by {event.editorDisplayName ?? 'Unknown'}
              </p>
            ) : null}
          </li>
        ))}
        {events.entries.length === 0 ? (
          <li className="text-muted-foreground p-8 text-center bg-card rounded-xl border border-border">
            No Events found.
          </li>
        ) : null}
      </ul>

      {/* Pagination */}
      {events.total > 0 && (
        <div className="mt-auto pt-6 flex items-center justify-between border-t border-border">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Showing page {events.page} of {totalPages} ({events.total} events)
          </p>
          <nav
            aria-label="Event pages"
            className="flex items-center gap-2 mx-auto sm:mx-0"
          >
            <Link
              search={{ ...search, page: events.page - 1 }}
              to="/events"
              disabled={events.page <= 1}
              className="p-2 rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition-colors"
            >
              Previous
            </Link>
            <Link
              search={{ ...search, page: events.page + 1 }}
              to="/events"
              disabled={events.page >= totalPages}
              className="p-2 rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition-colors"
            >
              Next
            </Link>
          </nav>
        </div>
      )}
    </>
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
