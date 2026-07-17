import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileJson,
  Clock,
} from 'lucide-react'

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
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Audit History
          </h2>
          <p className="text-base text-muted-foreground mt-1">
            Review privileged system changes and activity logs.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between mb-6">
        <form className="flex flex-col sm:flex-row gap-4 w-full" method="get">
          <div className="flex flex-col gap-1 w-full sm:w-64">
            <div className="relative w-full">
              <input
                aria-label="Action"
                defaultValue={search.action}
                name="action"
                placeholder="Filter by action (e.g. create_member)"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 w-full lg:w-80 lg:ml-auto">
            <div className="relative w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  aria-label="Actor email"
                  defaultValue={search.actorEmail}
                  name="actorEmail"
                  placeholder="Search actor email..."
                  className="flex h-10 w-full pl-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md h-10 text-sm font-medium transition-colors cursor-pointer"
              >
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Data Table Container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr
                  className="hover:bg-secondary/10 transition-colors group"
                  key={entry.id}
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/50 text-foreground text-xs font-medium border border-border">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {entry.actorEmail}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <span className="capitalize">{entry.targetType}</span>:{' '}
                    <span className="font-mono text-xs">{entry.targetId}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <time dateTime={entry.createdAt.toISOString()}>
                      {entry.createdAt.toLocaleString()}
                    </time>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <details className="relative inline-block text-left">
                      <summary className="text-primary hover:text-primary/80 transition-colors p-2 rounded-lg hover:bg-secondary cursor-pointer list-none inline-flex focus:outline-none">
                        <FileJson className="w-5 h-5" />
                      </summary>
                      <div className="absolute right-0 mt-2 z-50 w-[400px] sm:w-[500px] bg-card border border-border rounded-xl shadow-xl p-4 text-left">
                        <h4 className="font-semibold text-sm mb-3 border-b border-border pb-2">
                          Changed Values
                        </h4>
                        <pre className="overflow-x-auto rounded-lg bg-secondary/30 p-4 text-xs font-mono text-foreground border border-border">
                          {entry.changedValues}
                        </pre>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    No audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            Showing page {search.page} of {pages} ({total} total records)
          </span>
          <nav
            aria-label="Audit History pages"
            className="flex items-center gap-1"
          >
            <Link
              search={{ ...search, page: Math.max(1, search.page - 1) }}
              to="/admin/audit-history"
              disabled={search.page <= 1}
              className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-1 mx-2">
              <span className="w-8 h-8 rounded-md bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                {search.page}
              </span>
              {search.page < pages && (
                <>
                  <span className="text-muted-foreground px-1">/</span>
                  <span className="w-8 h-8 rounded-md text-muted-foreground text-sm font-medium flex items-center justify-center">
                    {pages}
                  </span>
                </>
              )}
            </div>

            <Link
              search={{ ...search, page: Math.min(pages, search.page + 1) }}
              to="/admin/audit-history"
              disabled={search.page >= pages}
              className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </nav>
        </div>
      </div>
    </>
  )
}
