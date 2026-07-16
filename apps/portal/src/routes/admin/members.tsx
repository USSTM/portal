import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Search, Plus, Edit, MoreVertical, X, UserX, UserCheck } from 'lucide-react'

import {
  createMemberAction,
  deactivateMemberAction,
  editMemberAction,
  getMembers,
  grantClubAccessAction,
  reactivateMemberAction,
  revokeClubAccessAction,
} from '../../features/admin/member-actions'
import { getClubs } from '../../features/admin/club-actions'

const searchSchema = z.object({
  clubId: z.string().uuid().optional(),
  lifecycle: z.enum(['active', 'deactivated']).optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/admin/members')({
  component: Members,
  loader: async ({ deps }) => ({
    clubs: await getClubs({ data: { lifecycle: 'active' } }),
    members: await getMembers({ data: deps }),
  }),
  loaderDeps: ({ search }) => searchSchema.parse(search),
  validateSearch: searchSchema,
})

function Members() {
  const { clubs, members } = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()
  const createMember = useServerFn(createMemberAction)
  const editMember = useServerFn(editMemberAction)
  const grantAccess = useServerFn(grantClubAccessAction)
  const revokeAccess = useServerFn(revokeClubAccessAction)
  const deactivate = useServerFn(deactivateMemberAction)
  const reactivate = useServerFn(reactivateMemberAction)
  const [error, setError] = useState<string>()

  async function refresh() {
    await router.invalidate()
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await createMember({
        data: {
          clubIds: form.getAll('clubIds').map(String),
          displayName: String(form.get('displayName') ?? ''),
          email: String(form.get('email') ?? ''),
        },
      })
      event.currentTarget.reset()
      setError(undefined)
      await refresh()
      toast.success('Member provisioned.')
      event.currentTarget.closest('details')?.removeAttribute('open')
    } catch {
      setError('Unable to provision Member.')
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Members</h2>
          <p className="text-base text-muted-foreground mt-1">Manage administration members, their status, and granted permissions.</p>
        </div>
        
        <details className="relative group">
          <summary className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer list-none">
            <Plus className="w-4 h-4" />
            Add Member
          </summary>
          <div className="absolute right-0 mt-2 z-50 w-[300px] sm:w-[400px] bg-card border border-border rounded-xl shadow-xl p-6">
            <h3 className="font-semibold mb-4 text-lg">Provision Member</h3>
            <form className="space-y-4" onSubmit={create}>
              <input name="displayName" placeholder="Display name" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              <input name="email" placeholder="Email" required type="email" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              <fieldset>
                <legend className="text-sm font-medium mb-2">Initial Club Access</legend>
                <div className="max-h-[150px] overflow-y-auto space-y-2 border border-border rounded-md p-2">
                  {clubs.entries.map((club) => (
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-1 rounded" key={club.id}>
                      <input name="clubIds" type="checkbox" value={club.id} className="rounded border-border text-primary focus:ring-primary" />
                      {club.shortName}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
                Provision Member
              </button>
            </form>
          </div>
        </details>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between mb-6">
        <form className="flex flex-col sm:flex-row gap-4 w-full" method="get">
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select defaultValue={search.lifecycle} name="lifecycle" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <label className="text-xs font-medium text-muted-foreground">Club Access</label>
            <select defaultValue={search.clubId} name="clubId" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">All Club Access</option>
              {clubs.entries.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.shortName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full lg:w-72 lg:ml-auto">
            <label className="text-xs font-medium text-muted-foreground invisible hidden lg:block">Search</label>
            <div className="relative w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  defaultValue={search.search}
                  name="search"
                  placeholder="Search email..."
                  className="flex h-10 w-full pl-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md h-10 text-sm font-medium transition-colors">
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {error ? <p className="text-sm text-destructive mb-4" role="alert">{error}</p> : null}

      {/* Data Table Container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto pb-48 -mb-48">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-secondary/30 border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Grants</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border relative">
              {members.map((member) => (
                <tr className={`hover:bg-secondary/10 transition-colors group ${member.lifecycle === 'deactivated' ? 'opacity-75' : ''}`} key={member.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                        {member.displayName.slice(0, 2)}
                      </div>
                      <span className="text-sm text-foreground font-medium">{member.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{member.email}</td>
                  <td className="px-6 py-4">
                    {member.lifecycle === 'active' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-primary text-xs font-medium border border-primary/20">Active</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium border border-border">Deactivated</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {member.grants.length > 0 ? member.grants.map((grant) => (
                        <span key={grant.clubId} className="inline-flex items-center px-2 py-0.5 rounded bg-secondary/50 text-foreground text-[11px] font-medium border border-border">
                          {grant.shortName}
                        </span>
                      )) : (
                        <span className="text-xs italic text-muted-foreground/50">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <details className="relative inline-block text-left">
                      <summary className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary cursor-pointer list-none inline-flex focus:outline-none">
                        <MoreVertical className="w-5 h-5" />
                      </summary>
                      <div className="absolute right-0 mt-2 z-50 w-[280px] bg-card border border-border rounded-xl shadow-xl p-4 text-left">
                        <h4 className="font-semibold text-sm mb-3 border-b border-border pb-2">Manage Member</h4>
                        
                        {/* Edit Form */}
                        <form
                          className="space-y-3 mb-4 border-b border-border pb-4"
                          onSubmit={async (event) => {
                            event.preventDefault()
                            const form = new FormData(event.currentTarget)
                            await editMember({
                              data: {
                                confirmed: form.get('confirmed') === 'on',
                                displayName: String(form.get('displayName') ?? ''),
                                email: String(form.get('email') ?? ''),
                                memberId: member.id,
                              },
                            })
                            await refresh()
                            toast.success('Member updated.')
                            event.currentTarget.closest('details')?.removeAttribute('open')
                          }}
                        >
                          <input className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" defaultValue={member.displayName} name="displayName" required placeholder="Display Name" />
                          <input className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" defaultValue={member.email} name="email" required type="email" placeholder="Email" />
                          <label className="flex items-center gap-2 text-xs">
                            <input name="confirmed" type="checkbox" className="rounded border-border text-primary" /> Confirm email change
                          </label>
                          <button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1">
                            <Edit className="w-3 h-3" /> Save Details
                          </button>
                        </form>

                        {/* Status Actions */}
                        {member.lifecycle === 'active' ? (
                          <div className="space-y-3">
                            <form
                              className="flex gap-2"
                              onSubmit={async (event) => {
                                event.preventDefault()
                                const form = new FormData(event.currentTarget)
                                await grantAccess({
                                  data: {
                                    clubId: String(form.get('clubId')),
                                    memberId: member.id,
                                  },
                                })
                                await refresh()
                                toast.success('Club Access granted.')
                                event.currentTarget.closest('details')?.removeAttribute('open')
                              }}
                            >
                              <select aria-label="Grant Club Access" defaultValue="" name="clubId" required className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                <option disabled value="">Grant Club Access</option>
                                {clubs.entries.map((club) => (
                                  <option key={club.id} value={club.id}>{club.shortName}</option>
                                ))}
                              </select>
                              <button type="submit" className="bg-primary/10 text-primary hover:bg-primary/20 px-2 rounded-md text-xs font-medium transition-colors" title="Grant">
                                <Plus className="w-4 h-4" />
                              </button>
                            </form>
                            
                            {/* Revoke List */}
                            {member.grants.length > 0 && (
                              <div className="space-y-1">
                                {member.grants.map(grant => (
                                  <div key={grant.clubId} className="flex items-center justify-between text-xs bg-secondary/30 p-1 rounded border border-transparent hover:border-border transition-colors">
                                    <span className="truncate pr-2 pl-1">{grant.shortName}</span>
                                    <button
                                      onClick={async () => {
                                        await revokeAccess({ data: { clubId: grant.clubId, memberId: member.id } })
                                        await refresh()
                                        toast.success('Club Access revoked.')
                                      }}
                                      type="button"
                                      className="text-destructive hover:text-destructive/80 p-1 hover:bg-destructive/10 rounded"
                                      title={`Revoke ${grant.shortName}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={async (e) => {
                                await deactivate({ data: { memberId: member.id } })
                                await refresh()
                                toast.success('Member deactivated.')
                                e.currentTarget.closest('details')?.removeAttribute('open')
                              }}
                              type="button"
                              className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 px-2 py-1.5 rounded-md text-xs font-medium transition-colors mt-2"
                            >
                              <UserX className="w-3 h-3" /> Deactivate
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <fieldset className="border border-border rounded-md p-2">
                              <legend className="text-xs font-medium px-1">Access to grant on reactivation</legend>
                              <div className="max-h-[100px] overflow-y-auto space-y-1 mt-1">
                                {clubs.entries.map((club) => (
                                  <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-secondary/50 p-1 rounded" key={club.id}>
                                    <input name={`reactivate-${member.id}`} type="checkbox" value={club.id} className="rounded border-border text-primary focus:ring-primary" /> {club.shortName}
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                            <button
                              onClick={async (event) => {
                                const parent = event.currentTarget.previousElementSibling
                                const clubIds = parent
                                  ? Array.from(
                                      parent.querySelectorAll<HTMLInputElement>('input:checked'),
                                    ).map((input) => input.value)
                                  : []
                                await reactivate({ data: { clubIds, memberId: member.id } })
                                await refresh()
                                toast.success('Member reactivated.')
                                event.currentTarget.closest('details')?.removeAttribute('open')
                              }}
                              type="button"
                              className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
                            >
                              <UserCheck className="w-3 h-3" /> Reactivate
                            </button>
                          </div>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

