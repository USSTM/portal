import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { getPortalBoardArchives } from '@/lib/portal-board'

interface PastBoardsBlockProps {
  heading?: string
  limit?: number
}

// Past boards from the portal's Board Archives, newest year first.
export async function PastBoardsBlock({
  heading,
  limit,
}: PastBoardsBlockProps) {
  const archives = await getPortalBoardArchives({ limit })

  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {heading && (
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12 text-highlight-dark">
            {heading}
          </h2>
        )}

        {archives.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Past boards are not available right now. Check back soon!
          </p>
        ) : (
          <Accordion
            className="w-full"
            collapsible
            defaultValue={archives[0].academicYear}
            type="single"
          >
            {archives.map((archive) => (
              <AccordionItem
                key={archive.academicYear}
                value={archive.academicYear}
              >
                <AccordionTrigger className="text-lg font-semibold">
                  {archive.academicYear}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {archive.boardMembers.map((member, index) => (
                      <li className="text-sm" key={index}>
                        <span className="font-medium">
                          {member.displayName}
                        </span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {member.boardPosition}
                        </span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  )
}
