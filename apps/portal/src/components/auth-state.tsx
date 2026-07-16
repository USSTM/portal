import { ShieldAlert } from 'lucide-react'
import { portalLogoutAction } from '../auth/logout'
import { Button } from './ui/button'

export function SignIn() {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-20 translate-x-1/4 -translate-y-1/4" />
        <div className="absolute w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-20 -translate-x-1/3 translate-y-1/3" />
      </div>

      <main className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm relative z-10 flex flex-col p-8 md:p-12 items-center text-center">
        {/* Logo / Brand Anchor */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="USSTM Logo" className="w-16 h-16 object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
              USSTM Portal
            </h1>
            <p className="text-base text-muted-foreground">
              Unified management portal for USSTM members and clubs
            </p>
          </div>
        </div>

        <div className="w-full h-px bg-border my-8 opacity-50" />

        {/* Action Area */}
        <div className="w-full flex flex-col items-center gap-6">
          <Button
            asChild
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-3 bg-secondary/30 hover:bg-secondary/60 text-foreground font-medium text-sm transition-all duration-200 active:scale-[0.98]"
          >
            <a href="/auth/sign-in?client=portal&returnTo=/">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </a>
          </Button>
        </div>
      </main>
    </div>
  )
}

export function AccessDenied() {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] bg-destructive/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-20 translate-x-1/4 -translate-y-1/4" />
        <div className="absolute w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-20 -translate-x-1/3 translate-y-1/3" />
      </div>

      <main className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm relative z-10 flex flex-col p-8 md:p-12 items-center text-center">
        {/* Logo / Brand Anchor */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Access Denied
            </h1>
            <p className="text-base text-muted-foreground">
              Your Google account is not provisioned for this portal. Contact USSTM if you need access.
            </p>
          </div>
        </div>

        <div className="w-full h-px bg-border my-8 opacity-50" />

        {/* Action Area */}
        <div className="w-full flex flex-col items-center gap-6">
          <form action={portalLogoutAction} method="post" className="w-full">
            <Button
              type="submit"
              variant="outline"
              className="w-full h-12 flex items-center justify-center gap-3 bg-secondary/30 hover:bg-secondary/60 text-foreground font-medium text-sm transition-all duration-200 active:scale-[0.98]"
            >
              Sign out
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
