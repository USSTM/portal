# USSTM Portal — Feature & Schema Research

> **Source**: All findings below were derived directly from the source code at `/Users/maruf/Code/usstm/portal`.
> No external documentation exists; every claim traces back to a specific file.

---

## 1. What is the Portal?

The **USSTM Portal** is an internal dashboard for the Undergraduate Science Society of Toronto Metropolitan University (USSTM). It allows **student groups** (not individual students) to:

- Log in with pre-provisioned credentials
- Create, edit, and delete campus events
- Access finance forms and operations resources
- View their account information
- Reset their password

Accounts are provisioned by USSTM staff — there is **no self-registration**. Users who don't have an account are directed to email `vp.operations@usstm.ca` or `tech@usstm.ca`.

---

## 2. Supabase Database Schemas (inferred from code)

The app uses **Supabase** (PostgreSQL). Three tables and three RPC functions are referenced.

### 2.1 `users` table

| Column       | Type   | Notes                                                          |
|-------------|--------|----------------------------------------------------------------|
| `id`        | `uuid` | Primary key; matches Supabase Auth UID                         |
| `username`  | `text` | Short group name displayed in the UI (e.g. navbar, event cards)|
| `group_name`| `text` | Full name of the student group                                 |
| `email`     | `text` | Login email                                                    |

**Source**: [account/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/account/page.tsx#L12-L16) queries `select("*")`, and the rendered fields are `username`, `group_name`, `email`. [signIn.ts](file:///Users/maruf/Code/usstm/portal/src/server/signIn.ts#L21-L25) and [passwordManage.ts](file:///Users/maruf/Code/usstm/portal/src/server/passwordManage.ts#L10-L14) also query by email. [getAllGroups.ts](file:///Users/maruf/Code/usstm/portal/src/server/getAllGroups.ts#L6-L8) selects `id, username` — confirming all "groups" are rows in `users`.

### 2.2 `events` table

| Column        | Type        | Notes                                                   |
|--------------|-------------|----------------------------------------------------------|
| `id`         | `uuid`      | Primary key                                              |
| `title`      | `text`      | Event title (3–100 chars enforced client-side)           |
| `description`| `text`      | Event description (10–1000 chars enforced client-side)   |
| `location`   | `text`      | TMU building name (or "N/A")                             |
| `address`    | `text`      | Full street address or online meeting link               |
| `start_time` | `timestamptz`| Event start                                             |
| `end_time`   | `timestamptz`| Event end                                               |
| `created_by` | `uuid`      | FK → `users.id` — the group that created the event      |

**Source**: [eventActions.ts](file:///Users/maruf/Code/usstm/portal/src/server/eventActions.ts#L229-L258) `addEvent` and [eventForm.tsx](file:///Users/maruf/Code/usstm/portal/src/components/dashboard/events/eventForm.tsx#L1-L25) use these exact field names. [eventCard.tsx](file:///Users/maruf/Code/usstm/portal/src/components/dashboard/events/eventCard.tsx#L37-L49) types them explicitly.

### 2.3 `organizers` table (join table)

| Column     | Type   | Notes                                   |
|-----------|--------|-----------------------------------------|
| `event_id`| `uuid` | FK → `events.id`                        |
| `group_id`| `uuid` | FK → `users.id` (the organizing group)  |

**Source**: [eventActions.ts](file:///Users/maruf/Code/usstm/portal/src/server/eventActions.ts#L76-L79) queries `organizers` by `event_id`, and [eventActions.ts L101-L104](file:///Users/maruf/Code/usstm/portal/src/server/eventActions.ts#L101-L104) queries by `group_id`.

### 2.4 Supabase RPC Functions

| RPC Name                                | Parameters                                                                                         | Purpose                                                   |
|-----------------------------------------|-----------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| `create_event_with_organizers`          | `p_title`, `p_description`, `p_location`, `p_address`, `p_start_time`, `p_end_time`, `p_created_by`, `p_group_ids` | Atomically inserts event + organizer rows                 |
| `update_event_with_organizers`          | `p_event_id`, `p_title`, `p_description`, `p_location`, `p_address`, `p_start_time`, `p_end_time`, `p_group_ids` (all nullable) | Partial update — only non-null fields are changed         |
| `delete_event_and_organizers_secured`   | `p_event_id`                                                                                        | Deletes event + its organizer rows in one transaction     |

**Source**: [eventActions.ts L249](file:///Users/maruf/Code/usstm/portal/src/server/eventActions.ts#L249), [eventActions.ts L358](file:///Users/maruf/Code/usstm/portal/src/server/eventActions.ts#L358), [eventActions.ts L206](file:///Users/maruf/Code/usstm/portal/src/server/eventActions.ts#L206).

---

## 3. Feature Inventory

### 3.1 Authentication & Session Management

| Feature                  | Details                                                                                                                                                     | Source File(s)                                                                                                                                                                            |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Email/password login** | Users sign in with email + password via Supabase Auth. After auth, the portal verifies the user exists in the `users` table.                                 | [signIn.ts](file:///Users/maruf/Code/usstm/portal/src/server/signIn.ts), [login/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/login/page.tsx)                                   |
| **Route protection**     | Next.js middleware + dashboard layout check for an active session. Unauthenticated users are redirected to `/login`.                                         | [middleware.ts](file:///Users/maruf/Code/usstm/portal/src/middleware.ts), [supabase/middleware.ts](file:///Users/maruf/Code/usstm/portal/src/lib/supabase/middleware.ts), [dashboard/layout.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/layout.tsx) |
| **Sign out**             | Client-side sign out via Supabase, then redirect to `/login`.                                                                                                | [signoutButton.tsx](file:///Users/maruf/Code/usstm/portal/src/components/general/signoutButton.tsx)                                                                                       |
| **Password reset (2-step)** | 1) User enters email → server validates it exists in `users` table → sends Supabase reset email. 2) User clicks link → lands on `/reset/session` → enters new password + confirmation → password is updated. | [passwordManage.ts](file:///Users/maruf/Code/usstm/portal/src/server/passwordManage.ts), [reset/auth/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/reset/auth/page.tsx), [activateReset.tsx](file:///Users/maruf/Code/usstm/portal/src/components/general/activateReset.tsx) |
| **No self-registration** | Login page directs non-users to contact `vp.operations@usstm.ca` and `tech@usstm.ca`.                                                                       | [login/page.tsx L69-L79](file:///Users/maruf/Code/usstm/portal/src/app/login/page.tsx#L69-L79)                                                                                           |

### 3.2 Dashboard Home

| Feature              | Details                                                                                         | Source                                                                                                     |
|----------------------|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| **Welcome message**  | Displays "Welcome, {username}!" with a description of the portal.                               | [dashboard/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/page.tsx)                     |
| **Quick-nav buttons**| Three buttons: "Finance Links", "Operations Links", "Manage Your Events" linking to sub-pages.  | [dashboard/page.tsx L46-L65](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/page.tsx#L46-L65)     |

### 3.3 Event Management (full CRUD)

| Feature                     | Details                                                                                                                                                                                           | Source                                                                                                                                                                                                        |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **List events**             | Shows events where the user is either the **creator** (`created_by`) or an **organizer** (via the `organizers` join table). Split into **Upcoming** (sorted ascending by start) and **Past** (sorted descending by end). | [events/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/events/page.tsx), [eventActions.ts getEventsForUser](file:///Users/maruf/Code/usstm/portal/src/server/eventActions.ts#L97-L177)     |
| **Search events**           | Client-side text search across all event fields. Separate search bars for upcoming and past events.                                                                                                | [eventSearch.tsx](file:///Users/maruf/Code/usstm/portal/src/components/dashboard/events/eventSearch.tsx), [events/page.tsx L97-L122](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/events/page.tsx#L97-L122) |
| **Paginate past events**    | Past events are paginated (4 per page) with Prev/Next controls.                                                                                                                                   | [events/page.tsx L124-L251](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/events/page.tsx#L124-L251)                                                                                               |
| **Event card display**      | Each card shows: title, formatted date range, description, TMU location, full address, organizers list, creator name. Smart date formatting (same-day vs multi-day; shows year for past events).     | [eventCard.tsx](file:///Users/maruf/Code/usstm/portal/src/components/dashboard/events/eventCard.tsx)                                                                                                          |
| **Create event**            | Form with: title, description, organizing groups (multi-select), TMU building, address, start datetime, end datetime. Enforces end ≥ start + 1 hour. Calls `create_event_with_organizers` RPC.      | [events/add/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/events/add/page.tsx), [eventForm.tsx](file:///Users/maruf/Code/usstm/portal/src/components/dashboard/events/eventForm.tsx)       |
| **Edit event (partial)**    | Same form in "edit" mode. Only changed ("dirty") fields are sent to the server. Creator-only authorization check. Calls `update_event_with_organizers` RPC.                                         | [manage/[event_id]/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/events/manage/%5Bevent_id%5D/page.tsx), [eventActions.ts updateEvent](file:///Users/maruf/Code/usstm/portal/src/server/eventActions.ts#L296-L381) |
| **Delete event**            | Creator-only. Shows a confirmation dialog before calling `delete_event_and_organizers_secured` RPC. Past events cannot be deleted (button hidden).                                                  | [confirmDialogue.tsx](file:///Users/maruf/Code/usstm/portal/src/components/dashboard/events/confirmDialogue.tsx), [eventActions.ts deleteEvent](file:///Users/maruf/Code/usstm/portal/src/server/eventActions.ts#L180-L227) |
| **Multi-group organizers**  | Events can have multiple organizing groups selected via a `react-select` multi-select dropdown. All registered groups (from `users` table) are available.                                           | [selectGroups.tsx](file:///Users/maruf/Code/usstm/portal/src/components/dashboard/events/selectGroups.tsx), [getAllGroups.ts](file:///Users/maruf/Code/usstm/portal/src/server/getAllGroups.ts)                 |
| **Creator-only management** | Only the creator can edit or delete an event. Non-creators who are organizers can view but not manage. Past events cannot be managed at all.                                                         | [eventCard.tsx L60-L118](file:///Users/maruf/Code/usstm/portal/src/components/dashboard/events/eventCard.tsx#L60-L118)                                                                                       |

### 3.4 Finance Links Page

| Feature               | Details                                                                                                                                                      | Source                                                                                                           |
|-----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| **External form links** | Five static links to external Google Forms / Asana forms, each with a tooltip description (desktop hover) or toggle-to-expand (mobile).                       | [finance/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/finance/page.tsx)                     |

The five finance forms are:

1. **Budget Request Template** — Google Sheets template for projected expenses
2. **Reimbursement Request Form** — Asana form for out-of-pocket expense reimbursement
3. **Internal Invoices Form** — Asana form for internal TMU transactions
4. **External Invoices Form** — Asana form for external transactions
5. **P-Card Request Form** — Asana form to request purchasing-card transactions

### 3.5 Operations Resources Page

| Feature               | Details                                                                                                                   | Source                                                                                                           |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| **External resource links** | Four static links with tooltip/toggle descriptions, same UX pattern as Finance.                                      | [operations/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/operations/page.tsx)               |

The four operations resources are:

1. **Resource Sheet** — Google Sheets list of general event supplies (cups, plates, carts, tables, etc.)
2. **Event Supplies & Request Form** — Google Form to request sign-out supplies (craft supplies, board games, decorations)
3. **Science Lounge Booking Form** — Asana form to book the Science Lounge (max 2x/month, 1-week lead time)
4. **Graphics Request Form** — Asana form to request social media graphics (10-day lead time)

### 3.6 Account Page (read-only)

| Feature                 | Details                                                                                                    | Source                                                                                              |
|-------------------------|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| **View profile**        | Displays: group username, group full name, email, account creation date. All read-only.                    | [account/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/account/page.tsx)        |
| **Update instructions** | Directs users to contact `tech@usstm.ca` or `vp.operations@usstm.ca` to update their info.                | [account/page.tsx L77-L84](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/account/page.tsx#L77-L84) |

### 3.7 Contact Page

| Feature               | Details                                                                                   | Source                                                                                                 |
|-----------------------|-------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| **Contact channels**  | Shows four contact methods: Email (with copy-to-clipboard / mailto on mobile), Instagram, Website, Linktree. | [contact/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/contact/page.tsx)           |

### 3.8 UX / Cross-cutting Features

| Feature                     | Details                                                                                                                     | Source                                                                                                                |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| **Toast notifications**     | Global `MessageAcceptor` component reads `?message=` and `?error=` query params, shows a toast banner (green for success, red for error) with auto-dismiss (5s), pause-on-hover, manual close, and a shrinking progress bar. Cleans the URL after reading. | [messageAcceptor.tsx](file:///Users/maruf/Code/usstm/portal/src/components/general/messageAcceptor.tsx)               |
| **Copy-to-clipboard**       | Email addresses have a "Copy" button (desktop) or "Email Us!" mailto link (mobile).                                          | [copyEmail.tsx](file:///Users/maruf/Code/usstm/portal/src/components/general/copyEmail.tsx), [contact/page.tsx](file:///Users/maruf/Code/usstm/portal/src/app/dashboard/contact/page.tsx) |
| **Responsive navbar**       | Desktop: horizontal nav links + sign-out button + account icon. Mobile: hamburger menu with slide-down dropdown. Close-on-click-outside. | [navbar.tsx](file:///Users/maruf/Code/usstm/portal/src/components/navbar/navbar.tsx)                                  |
| **Sticky footer**           | Fixed bottom footer showing "© {year} Created by PACS. All rights reserved."                                                 | [footer.tsx](file:///Users/maruf/Code/usstm/portal/src/components/footer/footer.tsx)                                  |
| **Custom 404 page**         | Shows a 404 message with a "Go to Dashboard" button. If not logged in, redirects to login.                                    | [not-found.tsx](file:///Users/maruf/Code/usstm/portal/src/app/not-found.tsx)                                          |
| **Loading state**           | A simple loading spinner component.                                                                                          | [loading.tsx](file:///Users/maruf/Code/usstm/portal/src/components/general/loading.tsx)                               |

---

## 4. Navigation Map

```
/                       → Redirects to /dashboard (if logged in) or /login
/login                  → Email + password login form
/reset/auth             → Password reset: enter email
/reset/session          → Password reset: enter new password (after clicking email link)
/dashboard              → Welcome page with quick-nav buttons
/dashboard/events       → List upcoming + past events (with search & pagination)
/dashboard/events/add   → Create new event form
/dashboard/events/manage/[event_id] → Edit event form (creator-only)
/dashboard/finance      → Finance form links
/dashboard/operations   → Operations resource links
/dashboard/account      → Read-only account profile
/dashboard/contact      → Contact info (email, Instagram, website, Linktree)
```

---

## 5. Design System Tokens

Defined in [globals.css](file:///Users/maruf/Code/usstm/portal/src/app/globals.css):

| Token                | Value     | Usage                           |
|---------------------|-----------|----------------------------------|
| `--color-background`| `#fafafa` | Page background                  |
| `--color-foreground`| `#1e1e1e` | Default text color               |
| `--color-highlight` | `#3e8989` | Primary CTA / accent (teal)      |
| `--color-highlight-dark` | `#002956` | Navbar bg / dark accent (navy) |
| `--color-highlight-blue` | `#e1e8f5` | Hover / focus states (light blue) |

Font: **Geist** (from Google Fonts), with Verdana fallback for headings.
