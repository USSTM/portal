import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  archiveClubAction,
  createClubAction,
  editClubAction,
  getClubs,
  reactivateClubAction,
} from '../../features/admin/club-actions'

const searchSchema = z.object({
  lifecycle: z.enum(['active', 'archived']).optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/admin/clubs')({
  component: Clubs,
  loader: ({ deps }) => getClubs({ data: deps }),
  loaderDeps: ({ search }) => searchSchema.parse(search),
  validateSearch: searchSchema,
})

function Clubs() {
  const { entries, total } = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()
  const createClub = useServerFn(createClubAction)
  const editClub = useServerFn(editClubAction)
  const archiveClub = useServerFn(archiveClubAction)
  const reactivateClub = useServerFn(reactivateClubAction)
  const [error, setError] = useState<string>()

  async function refresh() {
    await router.invalidate()
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await createClub({
        data: {
          contactEmail: String(form.get('contactEmail') ?? ''),
          fullName: String(form.get('fullName') ?? ''),
          shortName: String(form.get('shortName') ?? ''),
        },
      })
      event.currentTarget.reset()
      setError(undefined)
      await refresh()
      toast.success('Club created.')
    } catch {
      setError('Unable to create Club.')
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Administration
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Clubs</h1>
      </div>
      <form className="flex flex-wrap gap-3" method="get">
        <input
          defaultValue={search.search}
          name="search"
          placeholder="Search short name"
        />
        <select defaultValue={search.lifecycle} name="lifecycle">
          <option value="">All states</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit">Filter</button>
      </form>
      <form
        className="grid gap-3 rounded-md border p-4 sm:grid-cols-3"
        onSubmit={create}
      >
        <input name="shortName" placeholder="Short name" required />
        <input name="fullName" placeholder="Full name" required />
        <input
          name="contactEmail"
          placeholder="Contact email (optional)"
          type="email"
        />
        <button type="submit">Create Club</button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      <p className="text-sm text-muted-foreground">{total} Clubs</p>
      <ul className="space-y-3">
        {entries.map((club) => (
          <li className="rounded-md border p-4" key={club.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{club.fullName}</strong>
              <span>{club.lifecycle}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {club.shortName}
              {club.contactEmail ? ` · ${club.contactEmail}` : ''}
            </p>
            <details className="mt-3">
              <summary>Edit Club</summary>
              <form
                className="mt-3 grid gap-3 sm:grid-cols-3"
                onSubmit={async (event) => {
                  event.preventDefault()
                  const form = new FormData(event.currentTarget)
                  await editClub({
                    data: {
                      clubId: club.id,
                      contactEmail: String(form.get('contactEmail') ?? ''),
                      fullName: String(form.get('fullName') ?? ''),
                      shortName: String(form.get('shortName') ?? ''),
                    },
                  })
                  await refresh()
                  toast.success('Club updated.')
                }}
              >
                <input
                  defaultValue={club.shortName}
                  name="shortName"
                  required
                />
                <input defaultValue={club.fullName} name="fullName" required />
                <input
                  defaultValue={club.contactEmail ?? ''}
                  name="contactEmail"
                  type="email"
                />
                <button type="submit">Save</button>
              </form>
            </details>
            <button
              className="mt-3"
              onClick={async () => {
                if (club.lifecycle === 'active') {
                  await archiveClub({ data: { clubId: club.id } })
                } else {
                  await reactivateClub({ data: { clubId: club.id } })
                }
                await refresh()
                toast.success(
                  club.lifecycle === 'active'
                    ? 'Club archived.'
                    : 'Club restored.',
                )
              }}
              type="button"
            >
              {club.lifecycle === 'active' ? 'Archive' : 'Reactivate'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
