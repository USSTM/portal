import { createFileRoute } from '@tanstack/react-router'

import { Button } from '../components/ui/button'
import { getPortalIdentity } from '../auth/identity'

export const Route = createFileRoute('/')({
  component: Home,
  loader: () => getPortalIdentity(),
})

function Home() {
  const identity = Route.useLoaderData()

  if (identity.kind === 'denied') {
    return <AccessDenied />
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">USSTM</p>
        <h1 className="text-4xl font-semibold tracking-tight">Portal</h1>
        <p className="max-w-xl text-muted-foreground">Signed in as {identity.email}.</p>
        <form action="/auth/logout?client=portal&amp;returnTo=/" method="post">
          <Button type="submit">Sign out</Button>
        </form>
      </section>
    </main>
  )
}

function AccessDenied() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">USSTM</p>
        <h1 className="text-4xl font-semibold tracking-tight">Access denied</h1>
        <p className="max-w-xl text-muted-foreground">
          You do not have access to this portal. Contact USSTM if you need help.
        </p>
        <Button asChild>
          <a href="/auth/sign-in?client=portal">Sign in with Google</a>
        </Button>
      </section>
    </main>
  )
}
