import { Link, createFileRoute } from '@tanstack/react-router'

import { navigationForCapabilities } from '../auth/capabilities'
import { getPortalShell } from '../auth/shell'
import { AccessDenied } from '../components/auth-state'

export const Route = createFileRoute('/')({
  component: Home,
  loader: () => getPortalShell(),
})

function Home() {
  const identity = Route.useLoaderData()

  if (identity.kind === 'denied') {
    return <AccessDenied />
  }

  const navigation = navigationForCapabilities(identity.capabilities).filter(
    (item) => item.to !== '/',
  )

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">USSTM</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome
          {identity.kind === 'member'
            ? `, ${identity.account.displayName}`
            : ''}
        </h1>
        <p className="text-muted-foreground">
          Choose a portal area to continue.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navigation.map((item) => (
          <Link
            className="rounded-lg border bg-card p-5 transition-colors hover:bg-secondary"
            hash={item.hash}
            key={`${item.to}-${item.hash ?? ''}`}
            to={item.to}
          >
            <h2 className="font-medium">{item.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.label === 'Account'
                ? 'View your identity and active grants.'
                : item.label === 'Contact'
                  ? 'Find USSTM contact details.'
                  : `Open ${item.label.toLowerCase()}.`}
            </p>
          </Link>
        ))}
      </section>
    </main>
  )
}
