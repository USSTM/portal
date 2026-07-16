import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Edit, MoreVertical, Link as LinkIcon, Power, PowerOff } from 'lucide-react'

import {
  createResourceAction,
  editResourceAction,
  getResourcesForAdministration,
  setResourceActiveAction,
} from '../../features/resources/resource-actions'

export const Route = createFileRoute('/admin/resources')({
  component: AdminResources,
  loader: () => getResourcesForAdministration(),
})

function AdminResources() {
  const resources = Route.useLoaderData()
  const router = useRouter()
  const createResource = useServerFn(createResourceAction)
  const editResource = useServerFn(editResourceAction)
  const setResourceActive = useServerFn(setResourceActiveAction)
  const [error, setError] = useState<string>()

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
    resourceId?: string,
  ) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data = {
      category: String(form.get('category') ?? '') as 'finance' | 'operations',
      description: String(form.get('description') ?? ''),
      displayOrder: Number(form.get('displayOrder')),
      title: String(form.get('title') ?? ''),
      url: String(form.get('url') ?? ''),
    }
    try {
      if (resourceId) await editResource({ data: { ...data, resourceId } })
      else await createResource({ data })
      setError(undefined)
      event.currentTarget.reset()
      await router.invalidate()
      toast.success(resourceId ? 'Resource updated.' : 'Resource created.')
      event.currentTarget.closest('details')?.removeAttribute('open')
    } catch {
      setError('Unable to save Resource. Use a complete HTTPS URL.')
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Resources</h2>
          <p className="text-base text-muted-foreground mt-1">Manage platform resources, links, and documents.</p>
        </div>
        
        <details className="relative group">
          <summary className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer list-none">
            <Plus className="w-4 h-4" />
            Create Resource
          </summary>
          <div className="absolute right-0 mt-2 z-50 w-[300px] sm:w-[500px] bg-card border border-border rounded-xl shadow-xl p-6">
            <h3 className="font-semibold mb-4 text-lg">Create New Resource</h3>
            <ResourceForm onSubmit={submit} />
          </div>
        </details>
      </div>

      {error ? <p className="text-sm text-destructive mb-4" role="alert">{error}</p> : null}

      {/* Data Table Container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto pb-48 -mb-48">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-secondary/30 border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Order</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border relative">
              {resources.map((resource) => (
                <tr className={`hover:bg-secondary/10 transition-colors group ${!resource.active ? 'opacity-75' : ''}`} key={resource.id}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground font-medium">{resource.title}</span>
                      <a href={resource.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 truncate max-w-[250px]">
                        <LinkIcon className="w-3 h-3" />
                        {resource.url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/50 text-foreground text-[11px] font-medium border border-border uppercase tracking-wider">
                      {resource.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium">{resource.displayOrder}</span>
                  </td>
                  <td className="px-6 py-4">
                    {resource.active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-primary text-xs font-medium border border-primary/20">Active</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium border border-border">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <details className="relative inline-block text-left">
                      <summary className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary cursor-pointer list-none inline-flex focus:outline-none">
                        <MoreVertical className="w-5 h-5" />
                      </summary>
                      <div className="absolute right-0 mt-2 z-50 w-[300px] sm:w-[400px] bg-card border border-border rounded-xl shadow-xl p-4 text-left">
                        <h4 className="font-semibold text-sm mb-3 border-b border-border pb-2">Manage Resource</h4>
                        
                        <div className="mb-4 border-b border-border pb-4">
                          <ResourceForm
                            onSubmit={(event) => submit(event, resource.id)}
                            resource={resource}
                          />
                        </div>

                        {/* Status Actions */}
                        <button
                          onClick={async (e) => {
                            await setResourceActive({
                              data: { active: !resource.active, resourceId: resource.id },
                            })
                            await router.invalidate()
                            toast.success(
                              resource.active
                                ? 'Resource deactivated.'
                                : 'Resource activated.',
                            )
                            e.currentTarget.closest('details')?.removeAttribute('open')
                          }}
                          type="button"
                          className={`w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            resource.active 
                              ? 'text-destructive hover:bg-destructive/10' 
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {resource.active ? (
                            <><PowerOff className="w-3 h-3" /> Deactivate</>
                          ) : (
                            <><Power className="w-3 h-3" /> Activate</>
                          )}
                        </button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {resources.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No resources found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="mt-auto px-6 py-4 border-t border-border bg-card">
          <p className="text-sm text-muted-foreground">Total: {resources.length} Resources</p>
        </div>
      </div>
    </>
  )
}

function ResourceForm({
  onSubmit,
  resource,
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  resource?: {
    category: 'finance' | 'operations'
    description: string
    displayOrder: number
    title: string
    url: string
  }
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
          <select defaultValue={resource?.category ?? 'finance'} name="category" className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="finance">Finance</option>
            <option value="operations">Operations</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Order</label>
          <input
            defaultValue={resource?.displayOrder}
            min="0"
            name="displayOrder"
            required
            type="number"
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
      
      <input
        defaultValue={resource?.title}
        name="title"
        placeholder="Title"
        required
        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      
      <input
        defaultValue={resource?.url}
        name="url"
        placeholder="https://"
        required
        type="url"
        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      
      <textarea
        defaultValue={resource?.description}
        name="description"
        placeholder="Plain-text description"
        required
        rows={3}
        className="flex w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
      />
      
      <button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 mt-2" type="submit">
        {resource ? <><Edit className="w-3 h-3" /> Save Changes</> : <><Plus className="w-3 h-3" /> Create Resource</>}
      </button>
    </form>
  )
}
