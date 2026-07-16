import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

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
    } catch {
      setError('Unable to provision Member.')
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Administration
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Members</h1>
      </div>
      <form className="flex flex-wrap gap-3" method="get">
        <input
          defaultValue={search.search}
          name="search"
          placeholder="Search email"
        />
        <select defaultValue={search.lifecycle} name="lifecycle">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <select defaultValue={search.clubId} name="clubId">
          <option value="">All Club Access</option>
          {clubs.entries.map((club) => (
            <option key={club.id} value={club.id}>
              {club.shortName}
            </option>
          ))}
        </select>
        <button type="submit">Filter</button>
      </form>
      <form className="space-y-3 rounded-md border p-4" onSubmit={create}>
        <h2 className="font-medium">Provision Member</h2>
        <input name="displayName" placeholder="Display name" required />
        <input name="email" placeholder="Email" required type="email" />
        <fieldset>
          <legend>Initial Club Access</legend>
          {clubs.entries.map((club) => (
            <label className="mr-4" key={club.id}>
              <input name="clubIds" type="checkbox" value={club.id} />{' '}
              {club.shortName}
            </label>
          ))}
        </fieldset>
        <button type="submit">Provision Member</button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      <ul className="space-y-3">
        {members.map((member) => (
          <li className="rounded-md border p-4" key={member.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{member.displayName}</strong>
              <span>{member.lifecycle}</span>
            </div>
            <p className="text-sm text-muted-foreground">{member.email}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {member.grants.map((grant) => (
                <button
                  key={grant.clubId}
                  onClick={async () => {
                    await revokeAccess({
                      data: { clubId: grant.clubId, memberId: member.id },
                    })
                    await refresh()
                    toast.success('Club Access revoked.')
                  }}
                  type="button"
                >
                  Revoke {grant.shortName}
                </button>
              ))}
            </div>
            <details className="mt-3">
              <summary>Edit Member</summary>
              <form
                className="mt-3 flex flex-wrap gap-3"
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
                }}
              >
                <input
                  defaultValue={member.displayName}
                  name="displayName"
                  required
                />
                <input
                  defaultValue={member.email}
                  name="email"
                  required
                  type="email"
                />
                <label>
                  <input name="confirmed" type="checkbox" /> Confirm email
                  change
                </label>
                <button type="submit">Save</button>
              </form>
            </details>
            {member.lifecycle === 'active' ? (
              <div className="mt-3 flex flex-wrap gap-3">
                <form
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
                  }}
                >
                  <select
                    aria-label="Grant Club Access"
                    defaultValue=""
                    name="clubId"
                  >
                    <option disabled value="">
                      Grant Club Access
                    </option>
                    {clubs.entries.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.shortName}
                      </option>
                    ))}
                  </select>
                  <button type="submit">Grant</button>
                </form>
                <button
                  onClick={async () => {
                    await deactivate({ data: { memberId: member.id } })
                    await refresh()
                    toast.success('Member deactivated.')
                  }}
                  type="button"
                >
                  Deactivate
                </button>
              </div>
            ) : (
              <fieldset className="mt-3">
                <legend>New Club Access for reactivation</legend>
                {clubs.entries.map((club) => (
                  <label className="mr-4" key={club.id}>
                    <input
                      name={`reactivate-${member.id}`}
                      type="checkbox"
                      value={club.id}
                    />{' '}
                    {club.shortName}
                  </label>
                ))}
                <button
                  onClick={async (event) => {
                    const parent = event.currentTarget.parentElement
                    const clubIds = parent
                      ? Array.from(
                          parent.querySelectorAll<HTMLInputElement>(
                            'input:checked',
                          ),
                        ).map((input) => input.value)
                      : []
                    await reactivate({ data: { clubIds, memberId: member.id } })
                    await refresh()
                    toast.success('Member reactivated.')
                  }}
                  type="button"
                >
                  Reactivate
                </button>
              </fieldset>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
