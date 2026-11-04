import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { Archive } from 'lucide-react'

import { createBoardArchiveAction } from '../features/board/board-archive-actions'

type BoardArchiveSummary = {
  academicYear: string
  boardMembers: Array<{ boardPosition: string; displayName: string }>
}

/** Freezes the current board into a Board Archive and lists past archives. */
export function BoardArchivesCard({
  archives,
}: {
  archives: BoardArchiveSummary[]
}) {
  const router = useRouter()
  const createArchive = useServerFn(createBoardArchiveAction)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>()

  return (
    <section
      aria-labelledby="board-archives-title"
      className="bg-card border border-border rounded-xl shadow-sm p-6 mt-6 max-w-2xl space-y-4"
    >
      <div>
        <h3 className="font-semibold text-foreground" id="board-archives-title">
          Board Archives
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Archiving saves the current board&rsquo;s names and Board Positions,
          in Website order, as the board for an academic year. There can be one
          archive per year, and it cannot be changed afterwards.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault()
          const formElement = event.currentTarget
          const academicYear = String(
            new FormData(formElement).get('academicYear') ?? '',
          )
          if (
            !window.confirm(
              `Archive the current board as ${academicYear}? This cannot be undone.`,
            )
          ) {
            return
          }
          setIsSaving(true)
          try {
            const archive = await createArchive({ data: { academicYear } })
            await router.invalidate()
            setError(undefined)
            formElement.reset()
            toast.success(
              `Archived ${archive.entries} Board Members for ${archive.academicYear}.`,
            )
          } catch (caught) {
            setError(
              caught instanceof Error ? caught.message : 'Unable to archive.',
            )
          } finally {
            setIsSaving(false)
          }
        }}
      >
        <input
          aria-label="Academic year"
          className="min-w-0 flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          name="academicYear"
          placeholder="2025-2026"
          required
        />
        <button
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 px-4 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
          disabled={isSaving}
          type="submit"
        >
          <Archive className="w-4 h-4" /> Archive current board
        </button>
      </form>
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}

      {archives.length > 0 ? (
        <ul className="divide-y divide-border border border-border rounded-md">
          {archives.map((archive) => (
            <li
              className="flex items-center justify-between px-3 py-2 text-sm"
              key={archive.academicYear}
            >
              <span className="font-medium">{archive.academicYear}</span>
              <span className="text-muted-foreground">
                {archive.boardMembers.length} Board Members
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No Board Archives yet.</p>
      )}
    </section>
  )
}
