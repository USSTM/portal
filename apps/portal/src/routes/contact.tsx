import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { getPortalContact } from '../auth/shell'
import { AccessDenied } from '../components/auth-state'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/contact')({
  component: Contact,
  loader: () => getPortalContact(),
})

function Contact() {
  const result = Route.useLoaderData()
  if (result.kind === 'denied') return <AccessDenied />

  const entries = [
    {
      label: 'Email',
      value: result.contact.email,
      href: `mailto:${result.contact.email}`,
    },
    {
      label: 'Instagram',
      value: result.contact.instagram,
      href: result.contact.instagram,
    },
    {
      label: 'Website',
      value: result.contact.website,
      href: result.contact.website,
    },
    {
      label: 'Linktree',
      value: result.contact.linktree,
      href: result.contact.linktree,
    },
  ]

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">USSTM</p>
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
      </div>
      <dl className="space-y-4 rounded-lg border bg-card p-5">
        {entries.map((entry) => (
          <div
            className="flex flex-wrap items-center justify-between gap-3"
            key={entry.label}
          >
            <div>
              <dt className="text-sm text-muted-foreground">{entry.label}</dt>
              <dd>
                <a
                  className="underline"
                  href={entry.href}
                  rel="noreferrer"
                  target={entry.label === 'Email' ? undefined : '_blank'}
                >
                  {entry.value}
                </a>
              </dd>
            </div>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(entry.value)
                  toast.success(`${entry.label} copied`)
                } catch {
                  toast.error(`Unable to copy ${entry.label.toLowerCase()}.`)
                }
              }}
              type="button"
              variant="outline"
            >
              Copy
            </Button>
          </div>
        ))}
      </dl>
    </main>
  )
}
