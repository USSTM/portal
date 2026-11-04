import React from 'react'
import { Globe, Instagram, Mail, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getPortalClubs,
  instagramUrl,
  websiteClubImagePath,
  type PortalClubProfile,
  type PortalClubType,
} from '@/lib/portal-clubs'

interface ClubsDirectoryBlockProps {
  heading?: string
  description?: string
  clubType?: 'all' | PortalClubType
}

const typeLabels: Record<PortalClubType, string> = {
  course_union: 'Course Union',
  student_group: 'Student Group',
}

function ClubCard({ club }: { club: PortalClubProfile }) {
  const imagePath = websiteClubImagePath(club.imageUrl)
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element -- proxied portal image
            <img
              alt={`${club.fullName} logo`}
              className="w-full h-full object-cover"
              loading="lazy"
              src={imagePath}
            />
          ) : (
            <Users aria-hidden className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <CardTitle className="text-lg">{club.fullName}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              {club.shortName}
            </span>
            {club.type && (
              <Badge variant="secondary">{typeLabels[club.type]}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {club.description && (
          <p className="text-sm whitespace-pre-line">{club.description}</p>
        )}
        <ClubLinks club={club} />
      </CardContent>
    </Card>
  )
}

function ClubLinks({ club }: { club: PortalClubProfile }) {
  const links = [
    club.instagramHandle && {
      href: instagramUrl(club.instagramHandle),
      icon: Instagram,
      label: `@${club.instagramHandle}`,
    },
    club.websiteUrl && {
      href: club.websiteUrl,
      icon: Globe,
      label: 'Website',
    },
    club.contactEmail && {
      href: `mailto:${club.contactEmail}`,
      icon: Mail,
      label: club.contactEmail,
    },
  ].filter((link) => !!link)

  if (links.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {links.map(({ href, icon: Icon, label }) => (
        <li key={href}>
          <a
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
            href={href}
            rel="noopener noreferrer"
            target={href.startsWith('mailto:') ? undefined : '_blank'}
          >
            <Icon aria-hidden className="w-4 h-4" />
            {label}
          </a>
        </li>
      ))}
    </ul>
  )
}

export async function ClubsDirectoryBlock({
  heading,
  description,
  clubType = 'all',
}: ClubsDirectoryBlockProps) {
  const clubs = await getPortalClubs({
    type: clubType === 'all' ? undefined : clubType,
  })

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {heading && (
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-6 text-highlight-dark">
            {heading}
          </h2>
        )}
        {description && (
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-12">
            {description}
          </p>
        )}

        {clubs.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Clubs are not available right now. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <ClubCard club={club} key={club.id} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
