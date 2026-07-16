import { Link } from '@tanstack/react-router'

import { Button } from './ui/button'

export function AccessDenied() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Access denied</h1>
      <p className="text-muted-foreground">
        You do not have access to this portal. Contact USSTM if you need help.
      </p>
      <Button asChild>
        <Link to="/">Return to Dashboard</Link>
      </Button>
    </main>
  )
}
