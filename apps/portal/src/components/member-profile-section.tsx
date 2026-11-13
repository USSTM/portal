import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Upload, UserRound } from 'lucide-react'

import {
  removeOwnPhotoAction,
  updateOwnBioAction,
  uploadOwnPhotoAction,
} from '../features/member-profiles/member-profile-actions'
import { errorMessage } from '../lib/error-message'

const MAX_BIO_LENGTH = 500

export function MemberProfileSection({
  profile,
}: {
  profile: { bio: string | null; photoDataUrl: string | null } | null
}) {
  const router = useRouter()
  const uploadPhoto = useServerFn(uploadOwnPhotoAction)
  const removePhoto = useServerFn(removeOwnPhotoAction)
  const updateBio = useServerFn(updateOwnBioAction)
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
    <section
      aria-labelledby="member-profile-title"
      className="bg-card border border-border rounded-xl shadow-sm max-w-2xl p-6 sm:p-8 space-y-6"
      id="member-profile"
    >
      <div>
        <h2
          className="text-lg font-semibold text-foreground"
          id="member-profile-title"
        >
          Member Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Only you can edit your photo and bio. They appear on the USSTM website
          only while you are a Board Member.
        </p>
      </div>

      {profile === null ? (
        <p className="text-sm text-destructive" role="alert">
          Your Member Profile could not be loaded. Try again later.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-full border border-border bg-secondary/30 overflow-hidden flex items-center justify-center shrink-0">
              {profile.photoDataUrl ? (
                <img
                  alt="Your profile photo"
                  className="w-full h-full object-cover"
                  src={profile.photoDataUrl}
                />
              ) : (
                <UserRound className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <form
              className="flex flex-col gap-2"
              onSubmit={async (event) => {
                event.preventDefault()
                const formElement = event.currentTarget
                const form = new FormData(formElement)
                await run(() => uploadPhoto({ data: form }), 'Photo uploaded.')
                formElement.reset()
              }}
            >
              <input
                accept="image/jpeg,image/png,image/webp"
                aria-label="Profile photo"
                className="text-xs"
                name="photo"
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
                  <Upload className="w-3.5 h-3.5" />
                  {profile.photoDataUrl ? 'Replace' : 'Upload'}
                </button>
                {profile.photoDataUrl && (
                  <button
                    className="text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer disabled:opacity-50"
                    disabled={isSubmitting}
                    onClick={() => run(() => removePhoto(), 'Photo removed.')}
                    type="button"
                  >
                    Remove
                  </button>
                )}
              </div>
            </form>
          </div>

          <form
            className="space-y-2"
            onSubmit={async (event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              await run(
                () =>
                  updateBio({ data: { bio: String(form.get('bio') ?? '') } }),
                'Bio saved.',
              )
            }}
          >
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Bio
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-24"
                defaultValue={profile.bio ?? ''}
                key={profile.bio ?? ''}
                maxLength={MAX_BIO_LENGTH}
                name="bio"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Up to {MAX_BIO_LENGTH} characters.
            </p>
            <button
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              <Save className="w-4 h-4" /> Save Bio
            </button>
          </form>
        </>
      )}

      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
