import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Save } from 'lucide-react'

import { setBoardPositionOrderAction } from '../features/board/board-order-actions'

/** Orders the current Board Positions as the Website lists the board. */
export function BoardPositionOrder({ positions }: { positions: string[] }) {
  const router = useRouter()
  const saveOrder = useServerFn(setBoardPositionOrderAction)
  const [order, setOrder] = useState(positions)
  const [isSaving, setIsSaving] = useState(false)
  const changed = order.join('\n') !== positions.join('\n')

  function move(index: number, offset: -1 | 1) {
    const next = [...order]
    const target = index + offset
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)
  }

  return (
    <section
      aria-labelledby="board-order-title"
      className="bg-card border border-border rounded-xl shadow-sm p-6 mt-6 max-w-2xl space-y-4"
    >
      <div>
        <h3 className="font-semibold text-foreground" id="board-order-title">
          Website Order
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          The order of Board Positions on the USSTM website, including
          Administrators&rsquo; positions. Members who share a position are
          listed by name.
        </p>
      </div>

      {order.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No current Board Members.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {order.map((position, index) => (
            <li
              className="flex items-center justify-between gap-2 text-sm bg-secondary/30 px-3 py-2 rounded-md border border-border"
              key={position}
            >
              <span>
                <span className="text-muted-foreground mr-2">{index + 1}.</span>
                {position}
              </span>
              <span className="flex gap-1">
                <button
                  aria-label={`Move ${position} up`}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30 cursor-pointer"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  type="button"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  aria-label={`Move ${position} down`}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30 cursor-pointer"
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                  type="button"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <button
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
        disabled={!changed || isSaving}
        onClick={async () => {
          setIsSaving(true)
          try {
            await saveOrder({ data: { positions: order } })
            await router.invalidate()
            toast.success('Website order saved.')
          } catch (caught) {
            toast.error(
              caught instanceof Error
                ? caught.message
                : 'Unable to save order.',
            )
          } finally {
            setIsSaving(false)
          }
        }}
        type="button"
      >
        <Save className="w-4 h-4" /> Save Order
      </button>
    </section>
  )
}
