import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  Mail,
  Copy,
  Camera,
  Globe,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react'

import { getPortalContact } from '../auth/shell'
import { AccessDenied, SignIn } from '../components/auth-state'

export const Route = createFileRoute('/contact')({
  component: Contact,
  loader: () => getPortalContact(),
})

function Contact() {
  const result = Route.useLoaderData()
  if (result.kind === 'anonymous') return <SignIn />
  if (result.kind === 'denied') return <AccessDenied />

  const emailEntry = {
    label: 'Email',
    value: result.contact.email,
    href: `mailto:${result.contact.email}`,
  }

  const socialEntries = [
    {
      label: 'Instagram',
      description: 'Follow us for community updates, events, and announcements.',
      value: result.contact.instagram,
      href: result.contact.instagram,
      icon: Camera,
    },
    {
      label: 'Website',
      description: 'Visit the main USSTM website for student resources and information.',
      value: result.contact.website,
      href: result.contact.website,
      icon: Globe,
    },
    {
      label: 'Linktree',
      description: 'Quick access to current forms, links, and active initiatives.',
      value: result.contact.linktree,
      href: result.contact.linktree,
      icon: LinkIcon,
    },
  ]

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailEntry.value)
      toast.success('Email copied to clipboard')
    } catch {
      toast.error('Failed to copy email')
    }
  }

  return (
    <div className="max-w-4xl flex flex-col gap-8">
      {/* Page Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Contact Us
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Get in touch with the USSTM tech team or follow us on our official channels for the latest updates.
        </p>
      </header>

      {/* Technical Support Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Mail className="text-primary w-5 h-5" />
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Technical Support
          </h2>
        </div>

        <div className="bg-card border border-border shadow-sm rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                Support Email
              </p>
              <a
                href={emailEntry.href}
                className="text-lg sm:text-xl font-semibold text-foreground hover:text-primary transition-colors"
              >
                {emailEntry.value}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={emailEntry.href}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg transition-colors shadow-sm active:scale-95 duration-200"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </a>
            <button
              onClick={copyEmail}
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium text-sm rounded-lg border border-border transition-colors shadow-sm active:scale-95 duration-200"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      </section>

      {/* Official Channels Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Globe className="text-primary w-5 h-5" />
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Official Channels
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {socialEntries.map((social) => {
            const Icon = social.icon
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col justify-between bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 p-6"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    {social.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {social.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Visit channel</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </div>
              </a>
            )
          })}
        </div>
      </section>
    </div>
  )
}
