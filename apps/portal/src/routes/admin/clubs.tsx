import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Search,
  Plus,
  Edit,
  MoreVertical,
  Archive,
  ArchiveRestore,
} from 'lucide-react'

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
      event.currentTarget.closest('details')?.removeAttribute('open')
    } catch {
      setError('Unable to create Club.')
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Clubs
          </h2>
          <p className="text-base text-muted-foreground mt-1">
            Manage society clubs, affiliations, and status.
          </p>
        </div>

        <details className="relative group">
          <summary className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer list-none">
            <Plus className="w-4 h-4" />
            Create Club
          </summary>
          <div className="absolute right-0 mt-2 z-50 w-[300px] sm:w-[450px] bg-card border border-border rounded-xl shadow-xl p-6">
            <h3 className="font-semibold mb-4 text-lg">Create New Club</h3>
            <form className="space-y-4" onSubmit={create}>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="shortName"
                  placeholder="Short name (e.g. CS Soc)"
                  required
                  className="col-span-2 sm:col-span-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <input
                  name="fullName"
                  placeholder="Full name"
                  required
                  className="col-span-2 sm:col-span-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <input
                name="contactEmail"
                placeholder="Contact email (optional)"
                type="email"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                Create Club
              </button>
            </form>
          </div>
        </details>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between mb-6">
        <form className="flex flex-col sm:flex-row gap-4 w-full" method="get">
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              defaultValue={search.lifecycle}
              name="lifecycle"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full lg:w-72 lg:ml-auto">
            <label className="text-xs font-medium text-muted-foreground invisible hidden lg:block">
              Search
            </label>
            <div className="relative w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  defaultValue={search.search}
                  name="search"
                  placeholder="Search short name..."
                  className="flex h-10 w-full pl-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md h-10 text-sm font-medium transition-colors cursor-pointer"
              >
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {error ? (
        <p className="text-sm text-destructive mb-4" role="alert">
          {error}
        </p>
      ) : null}

      {/* Data Table Container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto pb-48 -mb-48">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-secondary/30 border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Club
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Short Name
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border relative">
              {entries.map((club) => (
                <tr
                  className={`hover:bg-secondary/10 transition-colors group ${club.lifecycle === 'archived' ? 'opacity-75' : ''}`}
                  key={club.id}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                        {club.shortName.slice(0, 2)}
                      </div>
                      <span className="text-sm text-foreground font-medium">
                        {club.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {club.shortName}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {club.contactEmail || (
                      <span className="italic opacity-50">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {club.lifecycle === 'active' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-primary text-xs font-medium border border-primary/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium border border-border">
                        Archived
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <details className="relative inline-block text-left">
                      <summary className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary cursor-pointer list-none inline-flex focus:outline-none">
                        <MoreVertical className="w-5 h-5" />
                      </summary>
                      <div className="absolute right-0 mt-2 z-50 w-[300px] bg-card border border-border rounded-xl shadow-xl p-4 text-left">
                        <h4 className="font-semibold text-sm mb-3 border-b border-border pb-2">
                          Manage Club
                        </h4>

                        {/* Edit Form */}
                        <form
                          className="space-y-3 mb-4 border-b border-border pb-4"
                          onSubmit={async (event) => {
                            event.preventDefault()
                            const form = new FormData(event.currentTarget)
                            await editClub({
                              data: {
                                clubId: club.id,
                                contactEmail: String(
                                  form.get('contactEmail') ?? '',
                                ),
                                fullName: String(form.get('fullName') ?? ''),
                                shortName: String(form.get('shortName') ?? ''),
                              },
                            })
                            await refresh()
                            toast.success('Club updated.')
                            event.currentTarget
                              .closest('details')
                              ?.removeAttribute('open')
                          }}
                        >
                          <input
                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            defaultValue={club.fullName}
                            name="fullName"
                            required
                            placeholder="Full Name"
                          />
                          <div className="flex gap-2">
                            <input
                              className="flex h-8 w-1/3 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              defaultValue={club.shortName}
                              name="shortName"
                              required
                              placeholder="Short"
                            />
                            <input
                              className="flex h-8 w-2/3 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              defaultValue={club.contactEmail ?? ''}
                              name="contactEmail"
                              type="email"
                              placeholder="Contact Email"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1"
                          >
                            <Edit className="w-3 h-3" /> Save Details
                          </button>
                        </form>

                        {/* Status Actions */}
                        <button
                          onClick={async (e) => {
                            if (club.lifecycle === 'active') {
                              await archiveClub({ data: { clubId: club.id } })
                            } else {
                              await reactivateClub({
                                data: { clubId: club.id },
                              })
                            }
                            await refresh()
                            toast.success(
                              club.lifecycle === 'active'
                                ? 'Club archived.'
                                : 'Club restored.',
                            )
                            e.currentTarget
                              .closest('details')
                              ?.removeAttribute('open')
                          }}
                          type="button"
                          className={`w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            club.lifecycle === 'active'
                              ? 'text-destructive hover:bg-destructive/10'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {club.lifecycle === 'active' ? (
                            <>
                              <Archive className="w-3 h-3" /> Archive
                            </>
                          ) : (
                            <>
                              <ArchiveRestore className="w-3 h-3" /> Reactivate
                            </>
                          )}
                        </button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    No clubs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="mt-auto px-6 py-4 border-t border-border bg-card">
          <p className="text-sm text-muted-foreground">Total: {total} Clubs</p>
        </div>
      </div>
    </>
  )
}
