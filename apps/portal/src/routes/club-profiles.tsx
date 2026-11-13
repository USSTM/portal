import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { ImageOff, Save, Upload } from 'lucide-react'

import {
  getEditableClubProfiles,
  removeClubImageAction,
  updateClubProfileAction,
  uploadClubImageAction,
} from '../features/clubs/club-profile-actions'
import { clubImagePath } from '../features/clubs/club-image-path'
import { errorMessage } from '../lib/error-message'

export const Route = createFileRoute('/club-profiles')({
  component: ClubProfiles,
  loader: () => getEditableClubProfiles(),
})

type ClubProfile = Awaited<ReturnType<typeof getEditableClubProfiles>>[number]

const inputClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

function ClubProfiles() {
  const clubs = Route.useLoaderData()
  const [selectedId, setSelectedId] = useState(clubs.at(0)?.id)
  const club = clubs.find((entry) => entry.id === selectedId) ?? clubs.at(0)

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Club Profiles
        </h2>
        <p className="text-base text-muted-foreground mt-1">
          The image, description and links shown for your Club on the USSTM
          website.
        </p>
      </div>

      {club ? (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8 max-w-2xl space-y-6">
          {clubs.length > 1 && (
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Club
              <select
                className={inputClassName}
                onChange={(event) => setSelectedId(event.target.value)}
                value={club.id}
              >
                {clubs.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.fullName}
                  </option>
                ))}
              </select>
            </label>
          )}
          <ClubImageEditor club={club} key={`image-${club.id}`} />
          <ClubProfileForm club={club} key={`profile-${club.id}`} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You do not have Club Access to any active Club.
        </p>
      )}
    </>
  )
}

function ClubImageEditor({ club }: { club: ClubProfile }) {
  const router = useRouter()
  const uploadImage = useServerFn(uploadClubImageAction)
  const removeImage = useServerFn(removeClubImageAction)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  async function run(action: () => Promise<unknown>, message: string) {
    setIsSubmitting(true)
    try {
      await action()
      await router.invalidate()
      setError(undefined)
      toast.success(message)
    } catch (caught) {
      setError(errorMessage(caught, 'Action failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-3 border-b border-border pb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Image
      </h3>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-lg border border-border bg-secondary/30 overflow-hidden flex items-center justify-center shrink-0">
          {club.imageId ? (
            <img
              alt={`${club.fullName} image`}
              className="w-full h-full object-cover"
              src={clubImagePath(club.imageId)}
            />
          ) : (
            <ImageOff className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <form
          className="flex flex-col gap-2"
          onSubmit={async (event) => {
            event.preventDefault()
            const formElement = event.currentTarget
            const form = new FormData(formElement)
            form.set('clubId', club.id)
            await run(() => uploadImage({ data: form }), 'Image uploaded.')
            formElement.reset()
          }}
        >
          <input
            accept="image/jpeg,image/png,image/webp"
            aria-label="Club image"
            className="text-xs"
            name="image"
            required
            type="file"
          />
          <p className="text-xs text-muted-foreground">
            JPEG, PNG or WebP, up to 2 MB.
          </p>
          <div className="flex gap-2">
            <button
              className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
            {club.imageId && (
              <button
                className="text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() =>
                  run(
                    () => removeImage({ data: { clubId: club.id } }),
                    'Image removed.',
                  )
                }
                type="button"
              >
                Remove
              </button>
            )}
          </div>
        </form>
      </div>
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

function ClubProfileForm({ club }: { club: ClubProfile }) {
  const router = useRouter()
  const updateProfile = useServerFn(updateClubProfileAction)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const text = (name: string) => String(form.get(name) ?? '')
        const type = text('type')
        setIsSubmitting(true)
        try {
          await updateProfile({
            data: {
              clubId: club.id,
              contactEmail: text('contactEmail'),
              description: text('description'),
              instagramHandle: text('instagramHandle'),
              type:
                type === 'student_group' || type === 'course_union'
                  ? type
                  : undefined,
              websiteUrl: text('websiteUrl'),
            },
          })
          await router.invalidate()
          setError(undefined)
          toast.success('Club Profile saved.')
        } catch (caught) {
          setError(errorMessage(caught, 'Unable to save profile.'))
        } finally {
          setIsSubmitting(false)
        }
      }}
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Profile
      </h3>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Type
        <select
          className={inputClassName}
          defaultValue={club.type ?? ''}
          name="type"
        >
          <option value="">Not specified</option>
          <option value="student_group">Student Group</option>
          <option value="course_union">Course Union</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Description
        <textarea
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-28"
          defaultValue={club.description ?? ''}
          maxLength={1000}
          name="description"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Instagram handle
        <input
          className={inputClassName}
          defaultValue={club.instagramHandle ?? ''}
          name="instagramHandle"
          placeholder="usstm"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Website
        <input
          className={inputClassName}
          defaultValue={club.websiteUrl ?? ''}
          name="websiteUrl"
          placeholder="https://example.com"
          type="url"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Contact email
        <input
          className={inputClassName}
          defaultValue={club.contactEmail ?? ''}
          name="contactEmail"
          type="email"
        />
      </label>
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
      <button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        disabled={isSubmitting}
        type="submit"
      >
        <Save className="w-4 h-4" /> Save Club Profile
      </button>
    </form>
  )
}
