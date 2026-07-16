import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'

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
    } catch {
      setError('Unable to save Resource. Use a complete HTTPS URL.')
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Administration
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Resources</h1>
      </div>
      <ResourceForm onSubmit={submit} />
      {error ? <p role="alert">{error}</p> : null}
      <ul className="space-y-3">
        {resources.map((resource) => (
          <li className="rounded-lg border bg-card p-5" key={resource.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{resource.title}</strong>
              <span>{resource.active ? 'Active' : 'Inactive'}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {resource.category} · order {resource.displayOrder}
            </p>
            <details className="mt-3">
              <summary>Edit Resource</summary>
              <ResourceForm
                onSubmit={(event) => submit(event, resource.id)}
                resource={resource}
              />
            </details>
            <button
              className="mt-3"
              onClick={async () => {
                await setResourceActive({
                  data: { active: !resource.active, resourceId: resource.id },
                })
                await router.invalidate()
                toast.success(
                  resource.active
                    ? 'Resource deactivated.'
                    : 'Resource activated.',
                )
              }}
              type="button"
            >
              {resource.active ? 'Deactivate' : 'Activate'}
            </button>
          </li>
        ))}
      </ul>
    </main>
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
      className="mt-3 grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
      onSubmit={onSubmit}
    >
      <select defaultValue={resource?.category ?? 'finance'} name="category">
        <option value="finance">Finance</option>
        <option value="operations">Operations</option>
      </select>
      <input
        defaultValue={resource?.displayOrder}
        min="0"
        name="displayOrder"
        required
        type="number"
      />
      <input
        defaultValue={resource?.title}
        name="title"
        placeholder="Title"
        required
      />
      <input
        defaultValue={resource?.url}
        name="url"
        placeholder="https://"
        required
        type="url"
      />
      <textarea
        className="sm:col-span-2"
        defaultValue={resource?.description}
        name="description"
        placeholder="Plain-text description"
        required
        rows={3}
      />
      <button className="sm:col-span-2" type="submit">
        {resource ? 'Save Resource' : 'Create Resource'}
      </button>
    </form>
  )
}
