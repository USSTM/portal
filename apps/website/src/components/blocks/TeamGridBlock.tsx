import React from 'react'
import { UserRound } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { getPortalBoard, websiteBoardPhotoPath } from '@/lib/portal-board'

interface TeamGridBlockProps {
  heading?: string
  columns?: '2' | '3' | '4'
}

// The current board, read from the portal in its Administrator-set order.
export async function TeamGridBlock({
  heading,
  columns = '3',
}: TeamGridBlockProps) {
  const boardMembers = await getPortalBoard()
  const gridClasses = {
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {heading && (
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12 text-highlight-dark">
            {heading}
          </h2>
        )}

        {boardMembers.length === 0 ? (
          <p className="text-center text-muted-foreground">
            The board is not available right now. Check back soon!
          </p>
        ) : (
          <div className={`grid ${gridClasses[columns]} gap-6`}>
            {boardMembers.map((member, index) => {
              const photoPath = websiteBoardPhotoPath(member.photoUrl)
              return (
                <Card
                  // The API has no IDs, and two entries can share a name and position.
                  key={`${index}-${member.boardPosition}-${member.displayName}`}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="p-0">
                    <div className="relative w-full aspect-square bg-muted flex items-center justify-center">
                      {photoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element -- proxied portal photo
                        <img
                          alt={member.displayName}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                          src={photoPath}
                        />
                      ) : (
                        <UserRound
                          aria-hidden
                          className="w-12 h-12 text-muted-foreground"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardTitle className="mb-2">{member.displayName}</CardTitle>
                    <CardDescription className={member.bio ? 'mb-4' : ''}>
                      {member.boardPosition}
                    </CardDescription>
                    {member.bio && (
                      <p className="text-sm whitespace-pre-line">
                        {member.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
