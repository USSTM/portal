import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Search,
  Plus,
  Edit,
  MoreVertical,
  X,
  UserX,
  UserCheck,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react'

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
import {
  deactivateAdministratorAction,
  editAdministratorAction,
  grantAdministratorAction,
  grantBoardPositionToAdministratorAction,
  grantClubAccessToAdministratorAction,
  reactivateAdministratorAction,
  revokeAdministratorAction,
  revokeBoardPositionFromAdministratorAction,
  revokeClubAccessFromAdministratorAction,
  updateAdministratorBoardPositionAction,
} from '../../features/admin/actions'
import { getPortalShell } from '../../auth/shell'

const ADMINISTRATOR_FILTER_VALUE = '__administrator__'

const searchSchema = z.object({
  clubId: z.string().optional(),
  lifecycle: z.enum(['active', 'deactivated']).optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/admin/members')({
  component: Members,
  loader: async ({ deps: rawDeps }) => {
    const deps = rawDeps as z.infer<typeof searchSchema>
    const administratorOnly = deps.clubId === ADMINISTRATOR_FILTER_VALUE
    const [clubs, members, shell] = await Promise.all([
      getClubs({ data: { lifecycle: 'active' } }),
      getMembers({
        data: {
          administratorOnly,
          clubId: administratorOnly ? undefined : deps.clubId,
          includeAdministrators: true,
          lifecycle: deps.lifecycle,
          search: deps.search,
        },
      }),
      getPortalShell(),
    ])
    return { clubs, isSuperuser: shell.kind === 'superuser', members }
  },
  loaderDeps: ({ search }) => searchSchema.parse(search),
  validateSearch: searchSchema,
})

function Members() {
  const { clubs, isSuperuser, members } = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()
  const createMember = useServerFn(createMemberAction)
  const [error, setError] = useState<string>()
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null

  const usstmClub = clubs.entries.find((club) => club.protected)

  async function refresh() {
    await router.invalidate()
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const clubIds = form.getAll('clubIds').map(String)
    const administrator = isSuperuser && form.get('administrator') === 'on'
    if (!administrator && clubIds.length === 0) {
      setError('At least one Club Access grant is required.')
      return
    }
    try {
      await createMember({
        data: {
          administrator,
          clubIds,
          displayName: String(form.get('displayName') ?? ''),
          email: String(form.get('email') ?? ''),
        },
      })
      formElement.reset()
      setError(undefined)
      await refresh()
      toast.success(
        administrator ? 'Administrator provisioned.' : 'Member provisioned.',
      )
      formElement.closest('details')?.removeAttribute('open')
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to provision Member.',
      )
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Members
          </h2>
          <p className="text-base text-muted-foreground mt-1">
            Manage administration members, their status, and granted
            permissions.
          </p>
        </div>

        <details className="relative group">
          <summary className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer list-none">
            <Plus className="w-4 h-4" />
            Add Member
          </summary>
          <div className="absolute right-0 mt-2 z-50 w-[300px] sm:w-[400px] bg-card border border-border rounded-xl shadow-xl p-6">
            <h3 className="font-semibold mb-4 text-lg">Provision Member</h3>
            <form className="space-y-4" onSubmit={create}>
              <input
                name="displayName"
                placeholder="Display name"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <input
                name="email"
                placeholder="Email"
                required
                type="email"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {isSuperuser && (
                <label className="flex items-center gap-2 text-sm cursor-pointer bg-secondary/30 border border-border rounded-md p-2">
                  <input
                    name="administrator"
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Grant Administrator (includes USSTM Club Access)
                </label>
              )}
              <fieldset>
                <legend className="text-sm font-medium mb-2">
                  Initial Club Access
                </legend>
                <div className="max-h-[150px] overflow-y-auto space-y-2 border border-border rounded-md p-2">
                  {clubs.entries.map((club) => (
                    <label
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-1 rounded"
                      key={club.id}
                    >
                      <input
                        name="clubIds"
                        type="checkbox"
                        value={club.id}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      {club.shortName}
                    </label>
                  ))}
                </div>
              </fieldset>
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
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
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <label className="text-xs font-medium text-muted-foreground">
              Grant
            </label>
            <select
              defaultValue={search.clubId}
              name="clubId"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Grants</option>
              <option value={ADMINISTRATOR_FILTER_VALUE}>Administrator</option>
              {clubs.entries.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.shortName}
                </option>
              ))}
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
                  placeholder="Search email..."
                  className="flex h-10 w-full pl-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md h-10 text-sm font-medium transition-colors"
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
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-secondary border-b border-border sticky top-0 z-10">
              <tr>
                <th className="bg-secondary px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="bg-secondary px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="bg-secondary px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="bg-secondary px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Grants
                </th>
                <th className="bg-secondary px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border relative">
              {members.map((member) => (
                <tr
                  className={`hover:bg-secondary/10 transition-colors group ${member.lifecycle === 'deactivated' ? 'opacity-75' : ''}`}
                  key={member.id}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                        {member.displayName.slice(0, 2)}
                      </div>
                      <span className="text-sm text-foreground font-medium">
                        {member.displayName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {member.email}
                  </td>
                  <td className="px-6 py-4">
                    {member.lifecycle === 'active' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-primary text-xs font-medium border border-primary/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium border border-border">
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {member.isAdministrator && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                          <ShieldCheck className="w-3 h-3" /> Administrator
                        </span>
                      )}
                      {member.grants.length > 0
                        ? member.grants.map((grant) => (
                            <span
                              key={grant.clubId}
                              className="inline-flex items-center px-2 py-0.5 rounded bg-secondary/50 text-foreground text-[11px] font-medium border border-border"
                            >
                              {grant.shortName}
                            </span>
                          ))
                        : !member.isAdministrator && (
                            <span className="text-xs italic text-muted-foreground/50">
                              None
                            </span>
                          )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.isAdministrator && !isSuperuser ? null : (
                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`transition-colors p-2 rounded-lg hover:bg-secondary cursor-pointer inline-flex focus:outline-none ${
                          member.isAdministrator
                            ? 'text-primary hover:text-primary/80'
                            : 'text-muted-foreground hover:text-primary'
                        }`}
                        title={
                          member.isAdministrator
                            ? 'Manage Administrator'
                            : 'Manage Member'
                        }
                        aria-label={
                          member.isAdministrator
                            ? `Manage administrator ${member.displayName}`
                            : `Manage ${member.displayName}`
                        }
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Member Modal (rendered outside the table container) */}
      {selectedMember && (
        <ManageMemberModal
          clubs={clubs.entries}
          isSuperuser={isSuperuser}
          member={selectedMember}
          onChanged={refresh}
          onClose={() => setSelectedMemberId(null)}
          usstmClubId={usstmClub?.id}
        />
      )}
    </>
  )
}

type MemberEntry = Awaited<ReturnType<typeof getMembers>>[number]
type ClubEntry = Awaited<ReturnType<typeof getClubs>>['entries'][number]

function ManageMemberModal({
  clubs,
  isSuperuser,
  member,
  onChanged,
  onClose,
  usstmClubId,
}: {
  clubs: ClubEntry[]
  isSuperuser: boolean
  member: MemberEntry
  onChanged: () => Promise<void>
  onClose: () => void
  usstmClubId: string | undefined
}) {
  const editMember = useServerFn(editMemberAction)
  const grantAccess = useServerFn(grantClubAccessAction)
  const revokeAccess = useServerFn(revokeClubAccessAction)
  const deactivate = useServerFn(deactivateMemberAction)
  const reactivate = useServerFn(reactivateMemberAction)

  const editAdministrator = useServerFn(editAdministratorAction)
  const grantAdministrator = useServerFn(grantAdministratorAction)
  const revokeAdministrator = useServerFn(revokeAdministratorAction)
  const grantClubAccess = useServerFn(grantClubAccessToAdministratorAction)
  const revokeClubAccess = useServerFn(revokeClubAccessFromAdministratorAction)
  const grantBoardPosition = useServerFn(
    grantBoardPositionToAdministratorAction,
  )
  const updateBoardPosition = useServerFn(
    updateAdministratorBoardPositionAction,
  )
  const revokeBoardPosition = useServerFn(
    revokeBoardPositionFromAdministratorAction,
  )
  const deactivateAdministrator = useServerFn(deactivateAdministratorAction)
  const reactivateAdministrator = useServerFn(reactivateAdministratorAction)

  const [modalError, setModalError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const grantableClubs = clubs.filter(
    (club) => !member.grants.some((grant) => grant.clubId === club.id),
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function runAction(
    action: () => Promise<unknown>,
    successMessage: string,
    closeOnSuccess = false,
  ) {
    setIsSubmitting(true)
    try {
      await action()
      await onChanged()
      setModalError(undefined)
      toast.success(successMessage)
      if (closeOnSuccess) {
        onClose()
      }
    } catch (caught) {
      setModalError(caught instanceof Error ? caught.message : 'Action failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-member-title"
        className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 my-8 space-y-5 text-left animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3
              id="manage-member-title"
              className="font-semibold text-lg text-foreground flex items-center gap-2"
            >
              {member.isAdministrator ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-primary" /> Manage
                  Administrator
                </>
              ) : (
                'Manage Member'
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {member.email} •{' '}
              <span
                className={
                  member.lifecycle === 'active'
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }
              >
                {member.lifecycle === 'active' ? 'Active' : 'Deactivated'}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {modalError && (
          <div
            className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium p-3 rounded-lg"
            role="alert"
          >
            {modalError}
          </div>
        )}

        {/* Member Details Form */}
        <form
          className="space-y-3 border-b border-border pb-5"
          onSubmit={async (event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            const confirmed = form.get('confirmed') === 'on'
            const displayName = String(form.get('displayName') ?? '')
            const email = String(form.get('email') ?? '')
            if (member.isAdministrator) {
              await runAction(
                () =>
                  editAdministrator({
                    data: {
                      confirmed,
                      displayName,
                      email,
                      memberId: member.id,
                    },
                  }),
                'Administrator updated.',
              )
            } else {
              await runAction(
                () =>
                  editMember({
                    data: {
                      confirmed,
                      displayName,
                      email,
                      memberId: member.id,
                    },
                  }),
                'Member updated.',
              )
            }
          }}
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Display Name
            </label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue={member.displayName}
              key={`name-${member.id}-${member.displayName}`}
              name="displayName"
              required
              placeholder="Display Name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Email Address
            </label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue={member.email}
              key={`email-${member.id}-${member.email}`}
              name="email"
              required
              type="email"
              placeholder="Email Address"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              name="confirmed"
              type="checkbox"
              className="rounded border-border text-primary focus:ring-primary"
            />{' '}
            Confirm email change
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Edit className="w-3.5 h-3.5" /> Save Details
          </button>
        </form>

        {member.lifecycle === 'active' ? (
          <div className="space-y-5">
            {/* Club Access Section */}
            <div className="space-y-3 border-b border-border pb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Club Access Grants
                </span>
                <span className="text-xs text-muted-foreground">
                  {member.grants.length} granted
                </span>
              </div>

              {grantableClubs.length > 0 && (
                <form
                  className="flex gap-2"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    const formElement = event.currentTarget
                    const form = new FormData(formElement)
                    const clubId = String(form.get('clubId') ?? '')
                    if (!clubId) return
                    if (member.isAdministrator) {
                      await runAction(
                        () =>
                          grantClubAccess({
                            data: { clubId, memberId: member.id },
                          }),
                        'Club Access granted.',
                      )
                    } else {
                      await runAction(
                        () =>
                          grantAccess({
                            data: { clubId, memberId: member.id },
                          }),
                        'Club Access granted.',
                      )
                    }
                    formElement.reset()
                  }}
                >
                  <select
                    aria-label="Grant Club Access"
                    defaultValue=""
                    name="clubId"
                    required
                    className="min-w-0 flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option disabled value="">
                      Select club to grant access...
                    </option>
                    {grantableClubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.shortName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 px-3 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Grant Club Access"
                  >
                    <Plus className="w-4 h-4" /> Grant
                  </button>
                </form>
              )}

              {member.grants.length > 0 ? (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {member.grants.map((grant) => (
                    <div
                      key={grant.clubId}
                      className="flex items-center justify-between text-xs bg-secondary/30 px-3 py-2 rounded-md border border-border"
                    >
                      <span className="font-medium text-foreground truncate pr-2">
                        {grant.shortName}
                      </span>
                      {member.isAdministrator &&
                      grant.clubId === usstmClubId ? (
                        <span
                          className="text-muted-foreground/60 text-[11px] italic shrink-0"
                          title="Held while Administrator"
                        >
                          Locked (Administrator)
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (member.isAdministrator) {
                              return runAction(
                                () =>
                                  revokeClubAccess({
                                    data: {
                                      clubId: grant.clubId,
                                      memberId: member.id,
                                    },
                                  }),
                                'Club Access revoked.',
                              )
                            }
                            return runAction(
                              () =>
                                revokeAccess({
                                  data: {
                                    clubId: grant.clubId,
                                    memberId: member.id,
                                  },
                                }),
                              'Club Access revoked.',
                            )
                          }}
                          type="button"
                          disabled={isSubmitting}
                          className="text-destructive hover:text-destructive/80 p-1 hover:bg-destructive/10 rounded transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                          title={`Revoke ${grant.shortName}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  No club access grants.
                </p>
              )}
            </div>

            {/* Board Position (Administrator only) */}
            {member.isAdministrator && isSuperuser && (
              <div className="space-y-3 border-b border-border pb-5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Board Position
                </span>
                {member.isBoardMember ? (
                  <div className="space-y-2">
                    <form
                      className="space-y-2"
                      onSubmit={async (event) => {
                        event.preventDefault()
                        const form = new FormData(event.currentTarget)
                        await runAction(
                          () =>
                            updateBoardPosition({
                              data: {
                                boardPosition: String(
                                  form.get('boardPosition') ?? '',
                                ),
                                displayName: member.displayName,
                                memberId: member.id,
                              },
                            }),
                          'Board Position updated.',
                        )
                      }}
                    >
                      <input
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        defaultValue={member.boardPosition ?? ''}
                        key={`board-${member.id}-${member.boardPosition}`}
                        name="boardPosition"
                        required
                        placeholder="Board Position"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Save Board Position
                      </button>
                    </form>
                    <button
                      onClick={() =>
                        runAction(
                          () =>
                            revokeBoardPosition({
                              data: { memberId: member.id },
                            }),
                          'Board Position revoked.',
                        )
                      }
                      type="button"
                      disabled={isSubmitting}
                      className="w-full text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Revoke Board Position
                    </button>
                  </div>
                ) : (
                  <form
                    className="flex gap-2"
                    onSubmit={async (event) => {
                      event.preventDefault()
                      const formElement = event.currentTarget
                      const form = new FormData(formElement)
                      await runAction(
                        () =>
                          grantBoardPosition({
                            data: {
                              boardPosition: String(
                                form.get('boardPosition') ?? '',
                              ),
                              memberId: member.id,
                            },
                          }),
                        'Board Position granted.',
                      )
                      formElement.reset()
                    }}
                  >
                    <input
                      className="min-w-0 flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      name="boardPosition"
                      placeholder="e.g. President, Treasurer..."
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 px-3 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Grant Board Position"
                    >
                      <Plus className="w-4 h-4" /> Grant
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {!member.isAdministrator && isSuperuser && (
                <button
                  type="button"
                  onClick={() =>
                    runAction(
                      () =>
                        grantAdministrator({ data: { memberId: member.id } }),
                      'Administrator granted.',
                    )
                  }
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 text-primary hover:bg-primary/10 px-3 py-2 rounded-md text-xs font-medium transition-colors border border-primary/20 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Grant Administrator
                </button>
              )}
              {member.isAdministrator && isSuperuser && (
                <button
                  onClick={() =>
                    runAction(
                      () =>
                        revokeAdministrator({ data: { memberId: member.id } }),
                      'Administrator revoked.',
                    )
                  }
                  type="button"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 px-3 py-2 rounded-md text-xs font-medium transition-colors border border-destructive/20 cursor-pointer disabled:opacity-50"
                >
                  <ShieldOff className="w-3.5 h-3.5" /> Revoke Administrator
                </button>
              )}
              <button
                onClick={() => {
                  if (member.isAdministrator) {
                    return runAction(
                      () =>
                        deactivateAdministrator({
                          data: { memberId: member.id },
                        }),
                      'Administrator deactivated.',
                    )
                  }
                  return runAction(
                    () => deactivate({ data: { memberId: member.id } }),
                    'Member deactivated.',
                  )
                }}
                type="button"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                <UserX className="w-3.5 h-3.5" /> Deactivate{' '}
                {member.isAdministrator ? 'Administrator' : 'Member'}
              </button>
            </div>
          </div>
        ) : (
          /* Deactivated Member Reactivation */
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              const clubIds = form.getAll('clubIds').map(String)
              const administrator = form.get('administrator') === 'on'
              if (member.isAdministrator) {
                if (!administrator && clubIds.length === 0) {
                  setModalError('At least one grant is required.')
                  return
                }
                await runAction(
                  () =>
                    reactivateAdministrator({
                      data: { administrator, clubIds, memberId: member.id },
                    }),
                  'Administrator reactivated.',
                )
              } else {
                if (clubIds.length === 0) {
                  setModalError('At least one Club Access grant is required.')
                  return
                }
                await runAction(
                  () => reactivate({ data: { clubIds, memberId: member.id } }),
                  'Member reactivated.',
                )
              }
            }}
          >
            {member.isAdministrator && isSuperuser && (
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-secondary/30 border border-border rounded-md p-2.5">
                <input
                  name="administrator"
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Restore Administrator grant (includes USSTM Club Access)
              </label>
            )}
            <fieldset className="border border-border rounded-md p-3">
              <legend className="text-xs font-medium px-1 text-muted-foreground">
                {member.isAdministrator
                  ? 'Club Access to grant'
                  : 'Access to grant on reactivation'}
              </legend>
              <div className="max-h-[140px] overflow-y-auto space-y-1.5 mt-1">
                {clubs.map((club) => (
                  <label
                    className="flex items-center gap-2 text-xs cursor-pointer hover:bg-secondary/50 p-1.5 rounded transition-colors"
                    key={club.id}
                  >
                    <input
                      name="clubIds"
                      type="checkbox"
                      value={club.id}
                      className="rounded border-border text-primary focus:ring-primary"
                    />{' '}
                    {club.shortName}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5" /> Reactivate{' '}
              {member.isAdministrator ? 'Administrator' : 'Member'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
