import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import {
  createBoardMemberAction,
  grantBoardAuthorityAction,
  getBoardMembers,
  revokeBoardAuthorityAction,
  updateBoardMemberAction,
} from '../../features/admin/board-member-actions'
import { getMembers } from '../../features/admin/member-actions'

export const Route = createFileRoute('/admin/board-members')({
  component: BoardMembers,
  loader: async () => ({
    boardMembers: await getBoardMembers(),
    members: await getMembers({ data: { lifecycle: 'active' } }),
  }),
})

function BoardMembers() {
  const { boardMembers, members } = Route.useLoaderData()
  const router = useRouter()
  const createBoardMember = useServerFn(createBoardMemberAction)
  const grantBoardAuthority = useServerFn(grantBoardAuthorityAction)
  const updateBoardMember = useServerFn(updateBoardMemberAction)
  const revokeBoardAuthority = useServerFn(revokeBoardAuthorityAction)

  async function refresh() {
    await router.invalidate()
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Administration
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Board Members</h1>
      </div>
      <form
        className="grid gap-3 rounded-md border p-4 sm:grid-cols-3"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          await createBoardMember({
            data: {
              boardPosition: String(form.get('boardPosition') ?? ''),
              displayName: String(form.get('displayName') ?? ''),
              email: String(form.get('email') ?? ''),
            },
          })
          event.currentTarget.reset()
          await refresh()
          toast.success('Board Member created.')
        }}
      >
        <input name="displayName" placeholder="Display name" required />
        <input name="email" placeholder="Email" required type="email" />
        <input name="boardPosition" placeholder="Board Position" required />
        <button type="submit">Create Board Member</button>
      </form>
      <form
        className="flex flex-wrap gap-3 rounded-md border p-4"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          await grantBoardAuthority({
            data: {
              boardPosition: String(form.get('boardPosition') ?? ''),
              memberId: String(form.get('memberId') ?? ''),
            },
          })
          event.currentTarget.reset()
          await refresh()
          toast.success('Board authority granted.')
        }}
      >
        <select name="memberId" required>
          <option value="">Grant existing Member</option>
          {members
            .filter((member) => !member.isBoardMember)
            .map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName} · {member.email}
              </option>
            ))}
        </select>
        <input name="boardPosition" placeholder="Board Position" required />
        <button type="submit">Grant Board Authority</button>
      </form>
      <ul className="space-y-3">
        {boardMembers.map((boardMember) => (
          <li className="rounded-md border p-4" key={boardMember.memberId}>
            <strong>{boardMember.displayName}</strong>
            <p className="text-sm text-muted-foreground">
              {boardMember.boardPosition} · {boardMember.email}
            </p>
            <details className="mt-3">
              <summary>Edit Board Member</summary>
              <form
                className="mt-3 flex flex-wrap gap-3"
                onSubmit={async (event) => {
                  event.preventDefault()
                  const form = new FormData(event.currentTarget)
                  await updateBoardMember({
                    data: {
                      boardPosition: String(form.get('boardPosition') ?? ''),
                      displayName: String(form.get('displayName') ?? ''),
                      memberId: boardMember.memberId,
                    },
                  })
                  await refresh()
                  toast.success('Board Position updated.')
                }}
              >
                <input
                  defaultValue={boardMember.displayName}
                  name="displayName"
                  required
                />
                <input
                  defaultValue={boardMember.boardPosition}
                  name="boardPosition"
                  required
                />
                <button type="submit">Save</button>
              </form>
            </details>
            <button
              className="mt-3"
              onClick={async () => {
                await revokeBoardAuthority({
                  data: { memberId: boardMember.memberId },
                })
                await refresh()
                toast.success('Board authority revoked.')
              }}
              type="button"
            >
              Revoke Board Authority
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
