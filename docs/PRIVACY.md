# USSTM Portal Privacy Policy

**Effective Date:** September 4, 2026  
**Last Updated:** September 4, 2026  

---

## 1. Introduction & Overview

The **Undergraduate Science Society of TMU ("USSTM", "we", "us", or "our")** operates the **USSTM Portal** (the "Portal"), serving students and academic clubs at Toronto Metropolitan University (40 Gould Street, Toronto, Ontario, Canada).

The USSTM Portal is an administrative and governance platform designed to:
- Grant authorized individuals explicit authority to act on behalf of USSTM and affiliated science clubs and student organizations without using shared accounts.
- Publish scheduled student events through an open public calendar and API.
- Maintain an open Office Hours drop-in schedule for science students to connect with USSTM Board Members.
- Provide curated operations and finance resources for student groups.

We take the privacy of our members, student representatives, and visitors seriously. This Privacy Policy explains what personal information is collected, how it is used, where it is published, how it is retained, and how you can exercise your privacy rights under applicable Canadian privacy legislation (including PIPEDA and FIPPA, where applicable).

---

## 2. Core Architectural Privacy Principles

The USSTM Portal is intentionally built with strict **data minimization**, **zero third-party tracking**, and **role-based security**:

1. **No Public Registration:** The Portal does not support open self-registration. Only individuals explicitly admitted in advance by an authorized Administrator or the Superuser ("Members") can sign in to authenticated features.
2. **No Passwords Stored:** We do not collect, hash, or store passwords. Authentication is handled exclusively through Google OAuth 2.0 with Proof Key for Code Exchange (PKCE).
3. **Minimal OAuth Scopes:** We request only the minimal permissions required to identify you (`openid` and `email`). We never request or access your Google Drive files, contacts, calendars, or other private profile details.
4. **No Third-Party Trackers or Ad Networks:** The Portal contains zero advertising, tracking pixels, or third-party analytics scripts (no Google Analytics, Meta Pixel, or commercial trackers).
5. **Short-Lived, Stateless Sessions:** We issue only host-only, signed, HTTP-only session cookies that automatically expire after eight (8) hours without sliding renewal or persistent "remember me" options.

---

## 3. Information We Collect and Process

The information processed by the Portal depends on your role and how you interact with the service:

### A. Public Visitors and Students
If you visit the public-facing pages of the Portal or consume our public API:
- **Technical Access Logs:** Standard web server access logs (HTTP method, requested URL, response status, user agent, IP address, and internal request IDs) strictly for operational reliability, abuse mitigation, and security diagnostics.
- **No Tracking Cookies:** Visitors browsing public pages do not receive advertising, profiling, or tracking cookies.

### B. Authenticated Members (Students & Representatives with Portal Grants)
When an admitted Member signs in using Google OAuth:
- **Google Identity Information:**
  - **Verified Email Address:** Provided by Google's OpenID Connect user-info endpoint.
  - **Email Verification Status:** Confirming that the email address is actively verified by Google.
  - *Note on Google Tokens:* Google OAuth access tokens are held transiently in server memory solely to verify your email address with Google during login, after which they are immediately discarded. We never store Google access tokens or refresh tokens in our database.
- **Member Profile Data (Configured by Administrators):**
  - **Display Name:** Your chosen or official public name (e.g., "Jane Doe").
  - **Normalized Email Address:** Used as the unique identifier to grant access.
  - **Account Lifecycle Status:** `active` or `deactivated`.
  - **Authorization Grants:** Specific organizational authority designations, including:
    - *Club Access:* Associations with designated student clubs (e.g., Biology Course Union, Chemistry Society).
    - *Board Member Status:* Your official executive or board title (e.g., "Vice President of Finance", "Director of Communications").
    - *Administrator Status:* Authority to manage members, clubs, resources, and events.

### C. Office Hours & Calendar Bookings
- **Booking Records:** When a Board Member reserves an Office Hours shift, the system records the date, time slot, and a snapshot of the Member's **Display Name** and **Board Position**.
- *Public Visibility:* The current and upcoming week's Office Hours calendar is publicly visible to all visitors so that TMU students know when student leaders are available in person for drop-in support.

### D. Club & Event Management Data
- **Club Information:** Club short name, full name, and club contact email address.
- **Event Listings:** Event title, description, start and end timestamps, physical location (e.g., campus room or address), owning club, and collaborating organizing clubs.
- *Public Exposure:* Event listings have no draft state; when created, event details are immediately published to the unauthenticated public Events API (`GET /api/v1/events`) for consumption by student-facing feeds and campus screens.
- *Internal Attribution:* The system records the creating and editing Member IDs for internal accountability. This personal attribution is **confidential and strictly excluded** from the public Events API.

### E. Administrative Audit Logs
- Under our institutional governance architecture (ADR 0010), privileged administrative mutations (such as adding or modifying members, assigning board positions, or archiving clubs) generate an immutable audit log entry.
- **Audit Data Collected:** `actorEmail` (email of the administrator taking the action), `action`, `targetType`, `targetId`, `changedValues` (JSON diff of modified fields), and the exact timestamp.

---

## 4. How We Use Your Information

We process personal information only for legitimate educational, operational, and governance purposes:

1. **Authentication & Authorization:** Verifying your identity through Google to ensure that only pre-approved student leaders and representatives access club and organizational records.
2. **Operations & Scheduling:** Displaying scheduled Office Hours so science students can drop in to consult USSTM board representatives.
3. **Campus Event Dissemination:** Distributing details of upcoming academic, networking, and social events organized by USSTM and affiliated science clubs.
4. **Institutional Accountability:** Maintaining an immutable audit log of privileged administrative actions to protect organizational integrity and prevent unauthorized changes.
5. **System Security & Stability:** Detecting and mitigating abuse, unauthorized access attempts, server errors, and technical anomalies.

---

## 5. Google API Services User Data Policy Compliance

The USSTM Portal complies with the **Google API Services User Data Policy**, including the **Limited Use** requirements:

1. **Specific Use:** Our use and transfer of information received from Google APIs to any other app adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.
2. **No Data Transfers for Advertising:** Data obtained from Google APIs (your verified email address) is never transferred to external parties, data brokers, or advertising networks.
3. **No Retargeting or Marketing:** We do not use Google user data to serve advertisements, profile individuals, or send unsolicited marketing.
4. **Human Review Restrictions:** Humans cannot inspect or read your raw Google authentication data unless:
   - You have given explicit consent to investigate a specific technical error;
   - It is necessary for security purposes (such as investigating an account compromise or abuse); or
   - It is strictly required by applicable law or university policy.

---

## 6. Cookies and Storage Technologies

The Portal uses only strictly necessary, functional cookies to support authentication and security:

| Cookie Name / Type | Purpose | Lifespan | Scope |
| :--- | :--- | :--- | :--- |
| **Session Cookie** (e.g., `usstm_portal_session`) | Asymmetrically signed JSON Web Token (JWT) verifying your authenticated email and authority. | 8 hours (Strictly enforced, non-sliding) | Host-only, `HttpOnly`, `Secure`, `SameSite=Lax` |
| **OAuth State / PKCE Cookies** | Temporary cryptographic nonce and code verifier to prevent Cross-Site Request Forgery (CSRF) during the Google sign-in flow. | Single sign-in attempt (Minutes) | Host-only, `HttpOnly`, `Secure` |

We **do not** use cookies for analytics, tracking across third-party websites, or advertising.

---

## 7. How We Share or Disclose Information

We do not sell, rent, lease, or monetize your personal information. We disclose data only under the following specific circumstances:

1. **Publicly Visible Operational Features:**
   - **Office Hours Calendar:** Board Members' display names and board titles are visible to anyone viewing the Office Hours schedule.
   - **Public Events API:** Event titles, descriptions, schedules, locations, and participating club names are publicly exposed at `/api/v1/events` for integration with external campus calendars and student displays.
2. **Internal USSTM Administration:**
   - Authorized Administrators and the deployment Superuser can view member rosters, club associations, and administrative audit logs for governance purposes.
3. **Infrastructure & Service Providers:**
   - **Google Identity Services (Google LLC):** Facilitates identity verification via OAuth 2.0.
   - **Hosting Infrastructure:** The Portal and its PostgreSQL database run on a dedicated USSTM-controlled host in a secure Canadian data center, managed via automated Docker Compose deployments.
   - **Automated Encrypted Backups:** Database snapshots are encrypted and stored in secure off-host storage for disaster recovery and operational business continuity.
4. **Legal and Safety Requirements:**
   - We may disclose information if required to do so by applicable law, a valid subpoena, court order, or university governance policy, or if we believe in good faith that disclosure is necessary to protect the safety, security, or integrity of USSTM, Toronto Metropolitan University, or our members.

---

## 8. Data Retention, Deactivation & Deletion Policy

Under our institutional records architecture ([ADR 0006](file:///docs/adr/0006-deactivate-members-instead-of-deleting-them.md)):

1. **Deactivation Instead of Permanent Deletion:**
   - When a Member graduates, leaves USSTM, or is removed, their profile is marked as **`deactivated`** rather than permanently deleted.
   - **Immediate Impact of Deactivation:**
     - The individual is immediately blocked from signing in.
     - All active authorization grants (Club Access, Board Member, Administrator) are revoked.
     - Any future Office Hours bookings are automatically canceled.
   - **Retention of Historical Records:**
     - Historical Office Hours shift bookings, event authorship records, and administrative audit entries remain intact.
     - *Rationale:* Maintaining historical attribution is necessary for student union financial transparency, governance accountability, and audit compliance.
2. **Past Booking Snapshots:**
   - Bookings retain a static snapshot of the Member's Display Name and Board Position at the time the booking was made. Subsequent name or role updates apply only to future bookings, ensuring historical calendars remain accurate.
3. **Server Diagnostics & Backups:**
   - Standard server access logs are routinely rotated and retained for 30 to 90 days.
   - Encrypted automated database backups are retained according to our disaster recovery backup schedule.

---

## 9. Data Security Safeguards

We implement modern, defense-in-depth technical and organizational measures to safeguard your personal data:

- **Transport Security:** All traffic is strictly encrypted in transit using Transport Layer Security (TLS 1.3 / HTTPS) terminated via the Caddy web server.
- **Asymmetric Key Cryptography:** Authentication cookies are signed asymmetrically (`jose` using an RSA/EdDSA private signing key on the auth microservice and verified with a public key on the portal).
- **Strict Boundary Validation:** All incoming data is rigorously sanitized and validated using Zod schemas and parameterized SQL queries through Drizzle ORM to eliminate injection risks.
- **Origin & CSRF Defense:** Strict origin validation and `SameSite=Lax` cookie policies protect all server mutations against Cross-Site Request Forgery.
- **Role-Based Authorization:** Authorization checks are performed server-side on every individual request directly against current database records.

---

## 10. Your Rights & Contact Information

Under Canadian privacy legislation and USSTM governance standards, you have rights regarding your personal information:

- **Right to Inquire & Access:** You may request to review what personal data USSTM holds regarding your membership or club representation.
- **Right to Rectification:** If your display name, club contact email, or associated details are inaccurate or out of date, you may request an update by contacting an Administrator.
- **Questions & Concerns:** If you have questions about how your data is handled or wish to submit a privacy concern, please contact:

**USSTM Technology & Operations Team**  
Undergraduate Science Society of TMU  
40 Gould Street, Toronto, ON M5B 2K3, Canada  
- **Support Email:** Contact the USSTM Tech Team via your administrator or check the [Contact Us](file:///apps/portal/src/routes/contact.tsx) page in the Portal.  
- **Website:** [USSTM Official Website](https://usstm.ca)  
- **Instagram:** [@usstmu](https://www.instagram.com/usstmu)  

---

## 11. Changes to this Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our operational procedures, technical architecture, or legal requirements. Any modifications will be posted to this document with an updated "Last Updated" date.
