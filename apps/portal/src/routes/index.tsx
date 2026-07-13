import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">USSTM Portal</h1>
          <p>Club records and USSTM services.</p>
          <Button className="mt-2" render={<a href="/auth/login" />}>
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  )
}
