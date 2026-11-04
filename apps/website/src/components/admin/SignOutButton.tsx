// Replaces Payload's logout button. Payload's own logout cannot clear the
// Website session, which the shared auth service owns, so this posts to the
// auth service's logout endpoint on this origin instead.
export function SignOutButton() {
  return (
    <form
      action="/auth/logout?client=website&returnTo=/admin/login"
      method="post"
    >
      <button
        className="btn btn--style-secondary btn--size-small"
        type="submit"
      >
        Sign out
      </button>
    </form>
  )
}
