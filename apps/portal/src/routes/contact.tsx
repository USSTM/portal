import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Mail, Copy, Camera, Globe, Link as LinkIcon } from 'lucide-react'

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
      value: result.contact.instagram,
      href: result.contact.instagram,
      icon: Camera
    },
    {
      label: 'Website',
      value: result.contact.website,
      href: result.contact.website,
      icon: Globe
    },
    {
      label: 'Linktree',
      value: result.contact.linktree,
      href: result.contact.linktree,
      icon: LinkIcon
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
    <>
      {/* Decorative Header Background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-secondary/20 border-b border-border/50 -z-10" />
      
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2 tracking-tight">Contact Us</h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Get in touch with the USSTM tech team or follow us on our official channels for the latest updates.
          </p>
        </div>

        {/* Contact Card */}
        <div className="w-full bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          {/* Primary Contact (Email) */}
          <div className="p-8 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Technical Support</h3>
                <p className="text-xl font-semibold text-foreground">{emailEntry.value}</p>
              </div>
            </div>
            <button 
              onClick={copyEmail}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg transition-colors shadow-sm active:scale-95 duration-200"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Email</span>
            </button>
          </div>

          {/* Social Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/50 bg-card">
            {socialEntries.map((social) => {
              const Icon = social.icon
              return (
                <a 
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center p-6 hover:bg-secondary/30 transition-colors group cursor-pointer text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {social.label}
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
