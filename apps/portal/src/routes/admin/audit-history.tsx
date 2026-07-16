import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Button } from '../../components/ui/button'
import { getAuditHistory } from '../../features/admin/audit-history-actions'

const searchSchema = z.object({
  action: z.string().optional(),
  actorEmail: z.string().optional(),
  page: z.coerce.number().int().positive().catch(1),
})

export const Route = createFileRoute('/admin/audit-history')({
  component: AuditHistory,
  loader: ({ deps }) => getAuditHistory({ data: deps }),
  loaderDeps: ({ search }) => searchSchema.parse(search),
  validateSearch: searchSchema,
})

function AuditHistory() {
  const { entries, total } = Route.useLoaderData()
  const search = Route.useSearch()
  const pages = Math.max(1, Math.ceil(total / 25))

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Administration</p>
        <h1 className="text-3xl font-semibold tracking-tight">Audit History</h1>
      </div>
      <form className="flex flex-wrap gap-3" method="get">
        <input
          aria-label="Actor email"
          defaultValue={search.actorEmail}
          name="actorEmail"
          placeholder="Actor email"
        />
        <input
          aria-label="Action"
          defaultValue={search.action}
          name="action"
          placeholder="Action"
        />
        <Button type="submit">Filter</Button>
      </form>
      <p className="text-sm text-muted-foreground">{total} privileged changes</p>
      <div className="space-y-3">
        {entries.map((entry) => (
          <article className="rounded-md border p-4" key={entry.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{entry.action}</strong>
              <time dateTime={entry.createdAt.toISOString()}>
                {entry.createdAt.toLocaleString()}
              </time>
            </div>
            <p className="text-sm text-muted-foreground">
              {entry.actorEmail} · {entry.targetType} · {entry.targetId}
            </p>
            <details className="mt-3">
              <summary>Changed values</summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">
                {entry.changedValues}
              </pre>
            </details>
          </article>
        ))}
      </div>
      <nav aria-label="Audit History pages" className="flex gap-2">
        {search.page > 1 ? (
          <Button asChild variant="outline">
            <Link search={{ ...search, page: search.page - 1 }} to="/admin/audit-history">
              Previous
            </Link>
          </Button>
        ) : null}
        {search.page < pages ? (
          <Button asChild variant="outline">
            <Link search={{ ...search, page: search.page + 1 }} to="/admin/audit-history">
              Next
            </Link>
          </Button>
        ) : null}
      </nav>
    </main>
  )
}
