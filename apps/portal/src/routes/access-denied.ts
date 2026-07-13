import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/access-denied")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          `<!doctype html><html><body><main><h1>Access has not been provisioned.</h1><p>${escapeHtml(process.env.ACCESS_CONTACT_GUIDANCE ?? "Contact USSTM for access.")}</p></main></body></html>`,
          {
            status: 403,
            headers: { "content-type": "text/html; charset=utf-8" },
          },
        ),
    },
  },
})

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}
