import { createFileRoute } from '@tanstack/react-router'

import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">USSTM</p>
        <h1 className="text-4xl font-semibold tracking-tight">Portal</h1>
        <p className="max-w-xl text-muted-foreground">
          Club resources, board office hours, and administrator-managed access
          will live here.
        </p>
        <Button disabled>Sign in coming soon</Button>
      </section>
    </main>
  )
}
