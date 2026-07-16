import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { Toaster } from 'sonner'
import appCss from '../styles.css?url'

import { navigationForCapabilities } from '../auth/capabilities'
import { getPortalShell } from '../auth/shell'
import { Button } from '../components/ui/button'
import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'USSTM Portal',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: PortalLayout,
  loader: () => getPortalShell(),
  notFoundComponent: NotFound,
  pendingComponent: Pending,
  errorComponent: UnexpectedError,
  shellComponent: RootDocument,
})

function PortalLayout() {
  const shell = Route.useLoaderData()

  if (shell.kind === 'denied') return <Outlet />

  const navigation = navigationForCapabilities(shell.capabilities)
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link className="font-semibold tracking-tight" to="/">
            USSTM Portal
          </Link>
          <nav
            aria-label="Portal"
            className="order-3 flex w-full gap-1 overflow-x-auto sm:order-2 sm:w-auto"
          >
            {navigation.map((item) => (
              <Link
                activeProps={{ className: 'bg-secondary text-foreground' }}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                key={item.to}
                hash={item.hash}
                to={item.to}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action="/auth/logout?client=portal&returnTo=/" method="post">
            <Button size="sm" type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}

function Pending() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 text-muted-foreground">
      Loading portal…
    </main>
  )
}

function NotFound() {
  return (
    <main className="mx-auto max-w-5xl space-y-3 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        This portal destination does not exist.
      </p>
      <Button asChild>
        <Link to="/">Return to Dashboard</Link>
      </Button>
    </main>
  )
}

function UnexpectedError({ error }: { error: unknown }) {
  const requestId = requestIdFromError(error)
  return (
    <main className="mx-auto max-w-5xl space-y-3 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        Please try again. If the problem continues, contact USSTM.
      </p>
      <p className="font-mono text-sm text-muted-foreground">
        Request ID: {requestId}
      </p>
    </main>
  )
}

function requestIdFromError(error: unknown) {
  if (error instanceof Error) {
    const match = /Request ID: ([\w-]+)/.exec(error.message)
    if (match) return match[1]
  }
  return 'unavailable'
}
