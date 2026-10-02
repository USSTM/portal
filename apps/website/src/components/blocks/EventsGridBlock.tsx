import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUpcomingPortalEvents, type PortalEvent } from '@/lib/portal-events'

interface EventsGridBlockProps {
  heading?: string
  limit?: number
  displayStyle?: 'grid' | 'list'
  showDate?: boolean
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Toronto',
  })

function EventCard({
  event,
  showDate,
  className,
}: {
  event: PortalEvent
  showDate: boolean
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{event.title}</CardTitle>
          {showDate && (
            <Badge variant="secondary">{formatDate(event.startAt)}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {event.owningClub.shortName}
          {event.location && ` · ${event.location}`}
        </p>
      </CardHeader>
      {event.description && (
        <CardContent>
          <p className="prose prose-sm whitespace-pre-line">
            {event.description}
          </p>
        </CardContent>
      )}
    </Card>
  )
}

export async function EventsGridBlock({
  heading,
  limit = 6,
  displayStyle = 'grid',
  showDate = true,
}: EventsGridBlockProps) {
  const events = await getUpcomingPortalEvents({ limit })

  return (
    <section className="py-12">
      <div
        className={
          displayStyle === 'list'
            ? 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
        }
      >
        {heading && (
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12 text-highlight-dark">
            {heading}
          </h2>
        )}

        {events.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No upcoming events. Check back soon!
          </p>
        ) : (
          <div
            className={
              displayStyle === 'list'
                ? 'space-y-4'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            }
          >
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                showDate={showDate}
                className="hover:shadow-lg transition-shadow"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
