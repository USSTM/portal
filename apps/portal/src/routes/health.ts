import { createFileRoute } from "@tanstack/react-router"
import { databaseIsReady } from "@workspace/database"

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async () => {
        if (await databaseIsReady()) {
          return Response.json({ status: "ready" })
        }

        return Response.json({ status: "unavailable" }, { status: 503 })
      },
    },
  },
})
