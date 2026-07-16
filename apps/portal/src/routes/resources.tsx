import { createFileRoute } from '@tanstack/react-router'
import { Landmark, HardHat, ExternalLink } from 'lucide-react'

import { getActiveResources } from '../features/resources/resource-actions'

export const Route = createFileRoute('/resources')({
  component: Resources,
  loader: () => getActiveResources(),
})

function Resources() {
  const resources = Route.useLoaderData()
  const categories = ['finance', 'operations'] as const

  return (
    <>
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">Resources Center</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Access essential documents, guidelines, and portals to support your academic and administrative workflows within the Science Society.
        </p>
      </header>

      {categories.map((category) => {
        const entries = resources.filter(
          (resource) => resource.category === category,
        )
        const Icon = category === 'finance' ? Landmark : HardHat
        
        return (
          <section className="mb-12" key={category}>
            <div className="flex items-center gap-3 mb-6 border-b border-border pb-2">
              <Icon className="text-primary w-7 h-7" />
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                {category === 'finance' ? 'Finance' : 'Operations'}
              </h2>
            </div>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entries.map((resource) => (
                <li key={resource.id}>
                  <a
                    href={resource.url}
                    rel="noreferrer"
                    target="_blank"
                    className="group flex flex-col h-full bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 border-t-4 border-t-primary p-6"
                  >
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <h3 className="text-xl font-semibold text-primary group-hover:text-primary/80 transition-colors line-clamp-2">
                        {resource.title}
                      </h3>
                      <ExternalLink className="text-muted-foreground group-hover:text-primary transition-colors w-5 h-5 flex-shrink-0" />
                    </div>
                    <p className="text-muted-foreground text-sm flex-1">
                      {resource.description}
                    </p>
                  </a>
                </li>
              ))}
              {entries.length === 0 ? (
                <li className="text-sm text-muted-foreground col-span-full">
                  No resources available.
                </li>
              ) : null}
            </ul>
          </section>
        )
      })}
    </>
  )
}
