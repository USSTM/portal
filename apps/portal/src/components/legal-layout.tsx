import * as React from 'react'
import { Link } from '@tanstack/react-router'
import type { PortalShell } from '../auth/shell'
import { Button } from './ui/button'
import { cn } from '#/lib/utils.ts'

interface LegalLayoutProps {
  currentDocument: 'privacy' | 'terms'
  shell: PortalShell
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export function LegalLayout({
  currentDocument,
  shell,
  title,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  const isAnonymous = shell.kind === 'anonymous' || shell.kind === 'denied'

  if (isAnonymous) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
        {/* Public Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 font-bold text-lg text-primary hover:opacity-90 transition-opacity"
            >
              <img
                src="/logo.png"
                alt="USSTM Logo"
                className="w-7 h-7 object-contain"
              />
              <span>USSTM Portal</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border text-sm">
                <Link
                  to="/privacy"
                  className={cn(
                    'px-3 py-1 rounded-md transition-colors',
                    currentDocument === 'privacy'
                      ? 'bg-background text-foreground font-medium shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className={cn(
                    'px-3 py-1 rounded-md transition-colors',
                    currentDocument === 'terms'
                      ? 'bg-background text-foreground font-medium shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Terms of Service
                </Link>
              </div>

              <Button asChild size="sm">
                <Link to="/">Sign In</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-8 pb-6 border-b border-border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Legal &amp; Governance
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
                  {title}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Effective Date: {lastUpdated} · Last Updated: {lastUpdated}
                </p>
              </div>
              <div className="flex sm:hidden items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border text-xs w-full justify-center">
                <Link
                  to="/privacy"
                  className={cn(
                    'px-3 py-1.5 rounded-md transition-colors flex-1 text-center',
                    currentDocument === 'privacy'
                      ? 'bg-background text-foreground font-medium shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className={cn(
                    'px-3 py-1.5 rounded-md transition-colors flex-1 text-center',
                    currentDocument === 'terms'
                      ? 'bg-background text-foreground font-medium shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary hover:prose-a:underline">
            {children}
          </article>
        </main>

        {/* Public Footer */}
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              &copy; 2026 Undergraduate Science Society of TMU (USSTM). 40 Gould
              Street, Toronto, ON.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/privacy"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <span>&middot;</span>
              <Link
                to="/terms"
                className="hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <span>&middot;</span>
              <Link
                to="/office-hours"
                className="hover:text-primary transition-colors"
              >
                Office Hours
              </Link>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Legal &amp; Governance
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Effective Date: {lastUpdated} · Last Updated: {lastUpdated}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border text-sm">
          <Link
            to="/privacy"
            className={cn(
              'px-3 py-1.5 rounded-md transition-colors',
              currentDocument === 'privacy'
                ? 'bg-background text-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className={cn(
              'px-3 py-1.5 rounded-md transition-colors',
              currentDocument === 'terms'
                ? 'bg-background text-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Terms of Service
          </Link>
        </div>
      </div>

      <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary hover:prose-a:underline">
        {children}
      </article>
    </div>
  )
}
