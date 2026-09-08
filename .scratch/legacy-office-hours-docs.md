# USSTM Office Hours — Feature & Schema Research

> **Source**: All findings below were derived directly from the source code at `/Users/maruf/Code/usstm/office`.
> No external documentation exists; every claim traces back to a specific file.

---

## 1. What is the Office Hours App?

The **USSTM Office Hours** app is a scheduling tool for USSTM board members to sign up for office-hour shifts at **EPH 443** (a room at Toronto Metropolitan University). It has two audiences:

| Audience | What they can do |
|----------|-----------------|
| **Public (anyone)** | View the weekly calendar showing who is staffing office hours each day/slot |
| **Board members (authenticated)** | Log in, view the calendar, and book/unbook themselves into shifts |

This is a separate, standalone app from the USSTM Portal. It shares the same Supabase project but uses **different tables** (`usstm_board`, `oh_shifts`, etc. — not `users`, `events`).

---

## 2. Supabase Database Schemas (inferred from code)

### 2.1 `usstm_board` table

| Column     | Type   | Notes                                                                       |
|-----------|--------|-----------------------------------------------------------------------------|
| `id`      | `uuid` | Primary key; matches Supabase Auth UID                                      |
| `email`   | `text` | Used for login validation (checked before auth)                             |
| `name`    | `text` | Member's display name (shown in calendar cells)                             |
| `position`| `text` | Board position/title (shown beneath name in calendar cells)                 |

**Source**: [signIn.ts](file:///Users/maruf/Code/usstm/office/src/server/signIn.ts#L10-L14) queries `usstm_board` by email. [types.ts](file:///Users/maruf/Code/usstm/office/src/lib/types.ts#L1-L5) defines `CalendarMember` with `member_id`, `name`, `position` — these come from the RPC joining `usstm_board`. [ohActions.ts](file:///Users/maruf/Code/usstm/office/src/server/ohActions.ts#L22-L32) `requireBoardMember()` checks `usstm_board.id`.

### 2.2 `oh_shifts` table

| Column      | Type   | Notes                                                                      |
|------------|--------|----------------------------------------------------------------------------|
| `id`       | `uuid` | Primary key                                                                |
| `member_id`| `uuid` | FK → `usstm_board.id` — who booked this shift                             |
| `shift_date`| `date`| The calendar date of the shift (e.g. `2026-07-14`)                         |
| `slot_id`  | `int`  | FK → time slot identifier (1–4), references a slots reference table        |

**Source**: [ohActions.ts L51-L56](file:///Users/maruf/Code/usstm/office/src/server/ohActions.ts#L51-L56) queries `oh_shifts` selecting `id, shift_date, slot_id` filtered by `member_id`. [ohActions.ts L98-L102](file:///Users/maruf/Code/usstm/office/src/server/ohActions.ts#L98-L102) inserts with `member_id`, `shift_date`, `slot_id`. [ohActions.ts L113-L116](file:///Users/maruf/Code/usstm/office/src/server/ohActions.ts#L113-L116) deletes by `id`.

### 2.3 Time Slots (reference data, inferred)

The calendar always renders exactly **4 slots per day** (Monday–Friday). Slot labels come from the RPC response:

| `slot_id` | `slot_label` (inferred) | `start_time` | `end_time` |
|-----------|------------------------|-------------|-----------|
| 1         | `10:00–12:00`          | `10:00:00`  | `12:00:00`|
| 2         | `12:00–14:00`          | `12:00:00`  | `14:00:00`|
| 3         | `14:00–16:00`          | `14:00:00`  | `16:00:00`|
| 4         | `16:00–18:00`          | `16:00:00`  | `18:00:00`|

**Source**: [types.ts](file:///Users/maruf/Code/usstm/office/src/lib/types.ts#L7-L14) defines `CalendarCell` with `slot_id: number` (1..4), `slot_label: string`, `start_time`, `end_time`. [CalendarGrid.tsx L59](file:///Users/maruf/Code/usstm/office/src/components/calendar/CalendarGrid.tsx#L59) iterates `[1, 2, 3, 4]`. The labels are populated by the RPC, not hardcoded in the app.

### 2.4 Supabase RPC Function

| RPC Name             | Parameters                    | Returns                                                          |
|---------------------|-------------------------------|------------------------------------------------------------------|
| `oh_calendar_range` | `p_start: date`, `p_end: date`| Array of `CalendarCell` objects — one per (date, slot) pair, each containing a `members[]` array of `{member_id, name, position}` |

**Source**: [ohActions.ts L37-L42](file:///Users/maruf/Code/usstm/office/src/server/ohActions.ts#L35-L43). This RPC likely joins `oh_shifts` with `usstm_board` and a time-slots reference table, cross-joining all dates × slots to produce the full grid.

---

## 3. Feature Inventory

### 3.1 Authentication

| Feature                    | Details                                                                                                                              | Source                                                                                                                                    |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| **Board-member-only login** | Email/password login. Before authenticating with Supabase Auth, the server checks that the email exists in `usstm_board`. Non-board-members are rejected. | [signIn.ts](file:///Users/maruf/Code/usstm/office/src/server/signIn.ts)                                                                   |
| **Route protection**       | Dashboard routes (`/dashboard/*`) require authentication via layout guard. The `/calendar` route is **public** but shows the navbar/footer if logged in. | [dashboard/layout.tsx](file:///Users/maruf/Code/usstm/office/src/app/dashboard/layout.tsx), [calendar/layout.tsx](file:///Users/maruf/Code/usstm/office/src/app/calendar/layout.tsx) |
| **Board member gate**      | The shifts page calls `requireBoardMember()` which checks that the authenticated user's ID exists in `usstm_board`. This is a server-side authorization check. | [ohActions.ts L22-L32](file:///Users/maruf/Code/usstm/office/src/server/ohActions.ts#L22-L32)                                              |
| **Sign out**               | Client-side sign out via Supabase, then redirect to `/login`.                                                                         | [signoutButton.tsx](file:///Users/maruf/Code/usstm/office/src/components/general/signoutButton.tsx)                                        |
| **No self-registration**   | Login page directs non-users to contact `vp.operations@usstm.ca` and `tech@usstm.ca`.                                                | [login/page.tsx L79-L93](file:///Users/maruf/Code/usstm/office/src/app/login/page.tsx#L79-L93)                                             |

### 3.2 Public Calendar (`/calendar`)

| Feature                  | Details                                                                                                                                         | Source                                                                                                                                                                                          |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Weekly grid view**     | Displays a Monday–Friday × 4-slot table. Each cell shows the members signed up for that slot (name + position) or "No one yet" if empty.         | [CalendarGrid.tsx](file:///Users/maruf/Code/usstm/office/src/components/calendar/CalendarGrid.tsx), [SlotCell.tsx](file:///Users/maruf/Code/usstm/office/src/components/calendar/SlotCell.tsx)     |
| **Week navigation**      | Prev/Next week buttons and a "Back to This Week" button. The current week is tracked via `?week=YYYY-MM-DD` query param.                         | [CalendarClient.tsx](file:///Users/maruf/Code/usstm/office/src/app/calendar/CalendarClient.tsx), [WeekToolbar.tsx](file:///Users/maruf/Code/usstm/office/src/components/calendar/WeekToolbar.tsx)   |
| **No auth required**     | The calendar page is fully public. If logged in, a link to "Shift Management" is shown; if not, a link to "log in" is shown.                     | [calendar/page.tsx L35-L54](file:///Users/maruf/Code/usstm/office/src/app/calendar/page.tsx#L35-L54)                                                                                            |
| **Conditional layout**   | If logged in, the navbar and footer are shown. If anonymous, bare layout (no chrome).                                                            | [calendar/layout.tsx](file:///Users/maruf/Code/usstm/office/src/app/calendar/layout.tsx#L15-L28)                                                                                                |
| **Color-coded cells**    | Empty slots: yellow background. Slots with members: blue background. Slots where "I" am signed up: red background.                               | [SlotCell.tsx L22-L28](file:///Users/maruf/Code/usstm/office/src/components/calendar/SlotCell.tsx#L22-L28)                                                                                       |
| **Mobile responsive**    | Horizontally scrollable table on small screens with tip text shown for mobile users.                                                             | [CalendarGrid.tsx L27-L29, L97-L99](file:///Users/maruf/Code/usstm/office/src/components/calendar/CalendarGrid.tsx#L27-L29)                                                                     |
| **Server-side data**     | Calendar data is fetched server-side via `getCalendarRange()` RPC, with `force-dynamic` to ensure fresh data on every request.                   | [calendar/page.tsx L1-L22](file:///Users/maruf/Code/usstm/office/src/app/calendar/page.tsx#L1-L22)                                                                                              |

### 3.3 Shift Management (`/dashboard/shifts`) — Board Members Only

| Feature                       | Details                                                                                                                                                                                     | Source                                                                                                                                                                   |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **View my shifts**            | Shows the same weekly grid as the public calendar, but with interactive "Add me" / "Remove me" buttons on each cell. Displays "You have picked X / 5 shifts this week."                      | [PlannerClient.tsx](file:///Users/maruf/Code/usstm/office/src/app/dashboard/shifts/PlannerClient.tsx), [shifts/page.tsx](file:///Users/maruf/Code/usstm/office/src/app/dashboard/shifts/page.tsx) |
| **Book a shift**              | Clicking "Add me" on an empty/available cell inserts a row in `oh_shifts` with the user's ID, the date, and the slot. Uses optimistic UI via React's `useOptimistic`.                         | [PlannerClient.tsx L60-L72](file:///Users/maruf/Code/usstm/office/src/app/dashboard/shifts/PlannerClient.tsx#L60-L72), [ohActions.ts bookShift](file:///Users/maruf/Code/usstm/office/src/server/ohActions.ts#L88-L106) |
| **Unbook a shift**            | Clicking "Remove me" on a cell where "I" am signed up deletes that `oh_shifts` row. Also uses optimistic UI.                                                                                 | [PlannerClient.tsx L51-L59](file:///Users/maruf/Code/usstm/office/src/app/dashboard/shifts/PlannerClient.tsx#L51-L59), [ohActions.ts unbookShift](file:///Users/maruf/Code/usstm/office/src/server/ohActions.ts#L109-L120) |
| **2-week booking window**     | Users can only book shifts for the current week and the next week (`MAX_WEEKS = 2`). Past dates and dates beyond 2 weeks are disabled. This is enforced **both** client-side and server-side. | [ohActions.ts L70-L85](file:///Users/maruf/Code/usstm/office/src/server/ohActions.ts#L70-L85), [PlannerClient.tsx L77-L92](file:///Users/maruf/Code/usstm/office/src/app/dashboard/shifts/PlannerClient.tsx#L77-L92)     |
| **Max 5 shifts per week**     | The UI shows a counter "X / 5 shifts this week" (enforced as `MAX_SHIFTS = 5` constant in the client). Additional DB-level rules likely exist via RLS/triggers.                              | [PlannerClient.tsx L11](file:///Users/maruf/Code/usstm/office/src/app/dashboard/shifts/PlannerClient.tsx#L11)                                                             |
| **Disabled cell UI**          | Non-bookable cells (past or beyond 2-week window) show "This slot has either passed or is not within 2 weeks" instead of "No one yet", and the toggle button is hidden.                      | [SlotCell.tsx L31-L36, L62](file:///Users/maruf/Code/usstm/office/src/components/calendar/SlotCell.tsx#L31-L36)                                                           |
| **Optimistic updates**        | Uses React 19's `useOptimistic` hook for instant UI feedback when booking/unbooking shifts, before the server action completes.                                                               | [PlannerClient.tsx L23](file:///Users/maruf/Code/usstm/office/src/app/dashboard/shifts/PlannerClient.tsx#L23)                                                             |
| **Week navigation**           | Same Prev/Next/Back-to-This-Week controls as the public calendar, but navigates within `/dashboard/shifts?week=`.                                                                            | [PlannerClient.tsx L30-L42](file:///Users/maruf/Code/usstm/office/src/app/dashboard/shifts/PlannerClient.tsx#L30-L42)                                                     |

### 3.4 UX / Cross-cutting Features

| Feature                     | Details                                                                                                     | Source                                                                                                                            |
|-----------------------------|-------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| **Toast notifications**     | Same `MessageAcceptor` component as the portal — reads `?message=` / `?error=` from URL, shows auto-dismiss toast with progress bar. | [messageAcceptor.tsx](file:///Users/maruf/Code/usstm/office/src/components/general/messageAcceptor.tsx)                            |
| **Copy-to-clipboard email** | Same responsive email copy component (clipboard on desktop, mailto on mobile).                               | [copyEmail.tsx](file:///Users/maruf/Code/usstm/office/src/components/general/copyEmail.tsx)                                        |
| **Responsive navbar**       | Two nav items: "Calendar" and "Shift Management". Desktop horizontal + sign-out. Mobile hamburger menu.      | [navbar.tsx](file:///Users/maruf/Code/usstm/office/src/components/navbar/navbar.tsx)                                               |
| **Sticky footer**           | Fixed bottom footer: "© {year} Created by PACS. All rights reserved."                                       | [footer.tsx](file:///Users/maruf/Code/usstm/office/src/components/footer/footer.tsx)                                               |
| **Custom 404 page**         | Links to "Go to Public Calendar" at `/calendar`.                                                             | [not-found.tsx](file:///Users/maruf/Code/usstm/office/src/app/not-found.tsx)                                                       |
| **Loading spinner**         | Full-screen loading overlay with spinner.                                                                    | [loading.tsx](file:///Users/maruf/Code/usstm/office/src/components/general/loading.tsx)                                            |

---

## 4. Navigation Map

```
/                           → Redirects to /calendar
/calendar                   → Public weekly calendar (no auth required)
/calendar?week=YYYY-MM-DD   → Public calendar for a specific week
/login                      → Board member login (email + password)
/dashboard                  → Redirects to /dashboard/calendar (Note: this route seems incorrect, likely meant to go to /dashboard/shifts or /calendar)
/dashboard/shifts           → Shift management grid (board members only)
/dashboard/shifts?week=YYYY-MM-DD → Shift management for a specific week
```

> [!NOTE]
> The `/dashboard` page redirects to `/dashboard/calendar` which doesn't exist as a route — this appears to be a bug or leftover from scaffolding. The intended destination is likely `/calendar` or `/dashboard/shifts`.

---

## 5. Key Differences from the Portal App

| Aspect              | Portal                                          | Office Hours                                    |
|---------------------|------------------------------------------------|------------------------------------------------|
| **Users table**     | `users` (student groups)                        | `usstm_board` (individual board members)        |
| **Primary feature** | Event CRUD for student groups                   | Shift booking calendar for board members        |
| **Public access**   | None — all pages require login                  | `/calendar` is fully public                     |
| **Data tables**     | `events`, `organizers`, `users`                 | `oh_shifts`, `usstm_board`, time slots (ref)    |
| **RPC functions**   | `create_event_with_organizers`, `update_event_with_organizers`, `delete_event_and_organizers_secured` | `oh_calendar_range`                            |
| **Password reset**  | Full 2-step reset flow                          | Not implemented                                 |
| **Account page**    | Read-only profile page                          | Not implemented                                 |
| **Finance/Ops**     | Finance + Operations link pages                 | Not implemented                                 |

---

## 6. Design System Tokens

Identical to the portal — defined in [globals.css](file:///Users/maruf/Code/usstm/office/src/app/globals.css):

| Token                | Value     | Usage                           |
|---------------------|-----------|----------------------------------|
| `--color-background`| `#fafafa` | Page background                  |
| `--color-foreground`| `#1e1e1e` | Default text color               |
| `--color-highlight` | `#3e8989` | Primary CTA / accent (teal)      |
| `--color-highlight-dark` | `#002956` | Navbar bg / dark accent (navy) |
| `--color-highlight-blue` | `#e1e8f5` | Hover / focus states (light blue) |

Font: **Geist** (from Google Fonts), with Verdana fallback for headings.

---

## 7. TypeScript Type Definitions

Defined in [types.ts](file:///Users/maruf/Code/usstm/office/src/lib/types.ts):

```typescript
type CalendarMember = {
    member_id: string;
    name: string;
    position: string;
};

type CalendarCell = {
    shift_date: string;   // 'YYYY-MM-DD'
    slot_id: number;      // 1..4
    slot_label: string;   // '10:00–12:00', etc.
    start_time: string;   // '10:00:00'
    end_time: string;     // '12:00:00'
    members: CalendarMember[];
};
```
