import { createFileRoute } from '@tanstack/react-router'

import { getActiveResources } from '../features/resources/resource-actions'

export const Route = createFileRoute('/resources')({
  component: Resources,
  loader: () => getActiveResources(),
})

function Resources() {
  const resources = Route.useLoaderData()
  const categories = ['finance', 'operations'] as const

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">USSTM</p>
        <h1 className="text-3xl font-semibold tracking-tight">Resources</h1>
        <p className="mt-1 text-muted-foreground">
          Finance and Operations links for active portal identities.
        </p>
      </div>
      {categories.map((category) => {
        const entries = resources.filter(
          (resource) => resource.category === category,
        )
        return (
          <section className="space-y-3" key={category}>
            <h2 className="text-xl font-semibold">
              {category === 'finance' ? 'Finance' : 'Operations'}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {entries.map((resource) => (
                <li className="rounded-lg border bg-card p-5" key={resource.id}>
                  <h3 className="font-medium">{resource.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                  <a
                    className="mt-3 inline-block underline"
                    href={resource.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open resource
                  </a>
                </li>
              ))}
              {entries.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No resources available.
                </li>
              ) : null}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
