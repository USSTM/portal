import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Plus, Edit, MoreVertical, ShieldOff, UserPlus, Shield } from 'lucide-react'

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
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Board Members</h2>
          <p className="text-base text-muted-foreground mt-1">Manage society leadership, positions, and authorities.</p>
        </div>
        
        <details className="relative group">
          <summary className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer list-none">
            <Plus className="w-4 h-4" />
            Add Board Member
          </summary>
          <div className="absolute right-0 mt-2 z-50 w-[300px] sm:w-[450px] bg-card border border-border rounded-xl shadow-xl p-6">
            
            {/* Create New Member Form */}
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Create New
            </h3>
            <form
              className="space-y-3 mb-6"
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
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
            >
              <input name="displayName" placeholder="Display name" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              <div className="grid grid-cols-2 gap-3">
                <input name="email" placeholder="Email" required type="email" className="col-span-2 sm:col-span-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                <input name="boardPosition" placeholder="Board Position" required className="col-span-2 sm:col-span-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
                Create Board Member
              </button>
            </form>

            <div className="border-t border-border my-4 relative">
              <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-card px-2 text-xs text-muted-foreground">OR</span>
            </div>

            {/* Grant Existing Member Form */}
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2 mt-6">
              <Shield className="w-4 h-4" /> Grant Authority
            </h3>
            <form
              className="space-y-3"
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
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
            >
              <select name="memberId" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Select existing member...</option>
                {members
                  .filter((member) => !member.isBoardMember)
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName} ({member.email})
                    </option>
                  ))}
              </select>
              <input name="boardPosition" placeholder="Board Position" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              <button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
                Grant Board Authority
              </button>
            </form>
          </div>
        </details>
      </div>

      {/* Data Table Container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col mt-6">
        <div className="overflow-x-auto pb-48 -mb-48">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-secondary/30 border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border relative">
              {boardMembers.map((boardMember) => (
                <tr className="hover:bg-secondary/10 transition-colors group" key={boardMember.memberId}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                        {boardMember.displayName.slice(0, 2)}
                      </div>
                      <span className="text-sm text-foreground font-medium">{boardMember.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/50 text-foreground text-[11px] font-medium border border-border">
                      {boardMember.boardPosition}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{boardMember.email}</td>
                  <td className="px-6 py-4 text-right">
                    <details className="relative inline-block text-left">
                      <summary className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary cursor-pointer list-none inline-flex focus:outline-none">
                        <MoreVertical className="w-5 h-5" />
                      </summary>
                      <div className="absolute right-0 mt-2 z-50 w-[280px] bg-card border border-border rounded-xl shadow-xl p-4 text-left">
                        <h4 className="font-semibold text-sm mb-3 border-b border-border pb-2">Manage Board Member</h4>
                        
                        {/* Edit Form */}
                        <form
                          className="space-y-3 mb-4 border-b border-border pb-4"
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
                            event.currentTarget.closest('details')?.removeAttribute('open')
                          }}
                        >
                          <input className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" defaultValue={boardMember.displayName} name="displayName" required placeholder="Display Name" />
                          <input className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" defaultValue={boardMember.boardPosition} name="boardPosition" required placeholder="Board Position" />
                          <button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1">
                            <Edit className="w-3 h-3" /> Save Details
                          </button>
                        </form>

                        {/* Status Actions */}
                        <button
                          onClick={async (e) => {
                            await revokeBoardAuthority({
                              data: { memberId: boardMember.memberId },
                            })
                            await refresh()
                            toast.success('Board authority revoked.')
                            e.currentTarget.closest('details')?.removeAttribute('open')
                          }}
                          type="button"
                          className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
                        >
                          <ShieldOff className="w-3 h-3" /> Revoke Authority
                        </button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {boardMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No board members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="mt-auto px-6 py-4 border-t border-border bg-card">
          <p className="text-sm text-muted-foreground">Total: {boardMembers.length} Board Members</p>
        </div>
      </div>
    </>
  )
}
