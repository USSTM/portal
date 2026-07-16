import { createFileRoute } from '@tanstack/react-router'
import { Mail, Shield, Users, Briefcase, LogOut } from 'lucide-react'

import { portalLogoutAction } from '../auth/logout'
import { getPortalShell } from '../auth/shell'
import { AccessDenied, SignIn } from '../components/auth-state'

export const Route = createFileRoute('/account')({
  component: Account,
  loader: () => getPortalShell(),
})

function Account() {
  const shell = Route.useLoaderData()
  if (shell.kind === 'anonymous') return <SignIn />
  if (shell.kind === 'denied') return <AccessDenied />

  if (shell.kind === 'superuser') {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Account</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Superuser</h1>
          </div>
          <form action={portalLogoutAction} method="post">
            <button
              className="bg-secondary/50 hover:bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
              type="submit"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden max-w-2xl">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Superuser Access</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Full system authority</p>
              </div>
            </div>

            <dl className="grid gap-6">
              <div className="grid sm:grid-cols-3 gap-1 sm:gap-4 items-start">
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Verified Email
                </dt>
                <dd className="sm:col-span-2 text-base font-medium text-foreground">{shell.account.email}</dd>
              </div>
              <div className="grid sm:grid-cols-3 gap-1 sm:gap-4 items-start pt-6 border-t border-border">
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Authority
                </dt>
                <dd className="sm:col-span-2 text-base font-medium text-foreground">{shell.account.authorityDescription}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Account Profile</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {shell.account.displayName}
          </h1>
        </div>
        
        <form action={portalLogoutAction} method="post">
          <button
            className="bg-secondary/50 hover:bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            type="submit"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden max-w-2xl">
        <div className="p-6 sm:p-8">
          
          <div className="flex items-center gap-5 mb-8 pb-8 border-b border-border">
            <div className="w-20 h-20 rounded-full bg-secondary/80 text-foreground flex items-center justify-center text-2xl font-bold uppercase border-2 border-border shadow-sm">
              {shell.account.displayName.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{shell.account.displayName}</h2>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Mail className="w-3.5 h-3.5" />
                {shell.account.email}
              </div>
            </div>
          </div>

          <dl className="grid gap-6">
            <div id="grants" className="grid sm:grid-cols-3 gap-2 sm:gap-4 items-start">
              <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-0.5">
                <Shield className="w-4 h-4" />
                Active Grants
              </dt>
              <dd className="sm:col-span-2">
                {shell.account.grants.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {shell.account.grants.map(grant => (
                      <span key={grant} className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border">
                        {grant}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No active grants</span>
                )}
              </dd>
            </div>

            <div id="clubs" className="grid sm:grid-cols-3 gap-2 sm:gap-4 items-start pt-6 border-t border-border">
              <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-0.5">
                <Users className="w-4 h-4" />
                Accessible Clubs
              </dt>
              <dd className="sm:col-span-2">
                {shell.account.clubs.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {shell.account.clubs.map(club => (
                      <div key={club.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/30 border border-border">
                        <span className="text-sm font-medium text-foreground">{club.fullName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">None</span>
                )}
              </dd>
            </div>

            {shell.account.boardPosition && (
              <div id="board-position" className="grid sm:grid-cols-3 gap-2 sm:gap-4 items-start pt-6 border-t border-border bg-primary/5 -mx-6 -mb-6 p-6 sm:-mx-8 sm:-mb-8 sm:p-8">
                <dt className="text-sm font-medium text-primary flex items-center gap-2 mt-0.5">
                  <Briefcase className="w-4 h-4" />
                  Board Position
                </dt>
                <dd className="sm:col-span-2 text-base font-semibold text-primary">
                  {shell.account.boardPosition}
                </dd>
              </div>
            )}
          </dl>

        </div>
      </div>
    </main>
  )
}
