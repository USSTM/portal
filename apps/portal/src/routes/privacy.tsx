import { createFileRoute } from '@tanstack/react-router'
import { getPortalShell } from '../auth/shell'
import { LegalLayout } from '../components/legal-layout'

export const Route = createFileRoute('/privacy')({
  component: PrivacyRoute,
  head: () => ({
    meta: [
      {
        title: 'Privacy Policy - USSTM Portal',
      },
    ],
  }),
  loader: () => getPortalShell(),
})

function PrivacyRoute() {
  const shell = Route.useLoaderData()

  return (
    <LegalLayout
      currentDocument="privacy"
      shell={shell}
      title="Privacy Policy"
      lastUpdated="September 4, 2026"
    >
      <h2>1. Introduction &amp; Overview</h2>
      <p>
        The{' '}
        <strong>
          Undergraduate Science Society of TMU (&ldquo;USSTM&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
        </strong>{' '}
        operates the <strong>USSTM Portal</strong> (the &ldquo;Portal&rdquo;),
        serving students and academic course unions and clubs at Toronto
        Metropolitan University, located at 40 Gould Street, Toronto, Ontario,
        Canada.
      </p>
      <p>
        The USSTM Portal is an administrative and governance platform designed
        to:
      </p>
      <ul>
        <li>
          Grant authorized individuals explicit authority to act on behalf of
          USSTM and affiliated science clubs without using shared accounts.
        </li>
        <li>
          Publish scheduled student events through an open public calendar and
          API.
        </li>
        <li>
          Maintain an open Office Hours drop-in schedule for science students to
          connect with USSTM Board Members.
        </li>
        <li>
          Provide curated operations and finance resources for student groups.
        </li>
      </ul>
      <p>
        We take the privacy of our members, student representatives, and
        visitors seriously. This Privacy Policy explains what personal
        information is collected, how it is used, where it is published, how it
        is retained, and how you can exercise your privacy rights under
        applicable Canadian privacy legislation (including PIPEDA and FIPPA,
        where applicable).
      </p>

      <h2>2. Core Architectural Privacy Principles</h2>
      <p>
        The USSTM Portal is intentionally built with strict{' '}
        <strong>data minimization</strong>,{' '}
        <strong>zero third-party tracking</strong>, and{' '}
        <strong>role-based security</strong>:
      </p>
      <ol>
        <li>
          <strong>No Public Registration:</strong> The Portal does not support
          open self-registration. Only individuals explicitly admitted in
          advance by an authorized Administrator or the Superuser
          (&ldquo;Members&rdquo;) can sign in to authenticated features.
        </li>
        <li>
          <strong>No Passwords Stored:</strong> We do not collect, hash, or
          store passwords. Authentication is handled exclusively through Google
          OAuth 2.0 with Proof Key for Code Exchange (PKCE).
        </li>
        <li>
          <strong>Minimal OAuth Scopes:</strong> We request only the minimal
          permissions required to identify you (<code>openid</code> and{' '}
          <code>email</code>). We never request or access your Google Drive
          files, contacts, calendars, or other private profile details.
        </li>
        <li>
          <strong>No Third-Party Trackers or Ad Networks:</strong> The Portal
          contains zero advertising, tracking pixels, or third-party analytics
          scripts (no Google Analytics, Meta Pixel, or commercial trackers).
        </li>
        <li>
          <strong>Short-Lived, Stateless Sessions:</strong> We issue only
          host-only, signed, HTTP-only session cookies that automatically expire
          after eight (8) hours without sliding renewal or persistent
          &ldquo;remember me&rdquo; options.
        </li>
      </ol>

      <h2>3. Information We Collect and Process</h2>

      <h3>A. Public Visitors and Students</h3>
      <p>
        If you visit the public-facing pages of the Portal or consume our public
        API:
      </p>
      <ul>
        <li>
          <strong>Technical Access Logs:</strong> Standard web server access
          logs (HTTP method, requested URL, response status, user agent, IP
          address, and internal request IDs) strictly for operational
          reliability, abuse mitigation, and security diagnostics.
        </li>
        <li>
          <strong>No Tracking Cookies:</strong> Visitors browsing public pages
          do not receive advertising, profiling, or tracking cookies.
        </li>
      </ul>

      <h3>
        B. Authenticated Members (Students &amp; Representatives with Portal
        Grants)
      </h3>
      <p>When an admitted Member signs in using Google OAuth:</p>
      <ul>
        <li>
          <strong>Google Identity Information:</strong>
          <ul>
            <li>
              <strong>Verified Email Address:</strong> Provided by
              Google&rsquo;s OpenID Connect user-info endpoint.
            </li>
            <li>
              <strong>Email Verification Status:</strong> Confirming that the
              email address is actively verified by Google.
            </li>
            <li>
              <em>Note on Google Tokens:</em> Google OAuth access tokens are
              held transiently in server memory solely to verify your email
              address with Google during login, after which they are immediately
              discarded. We never store Google access tokens or refresh tokens
              in our database.
            </li>
          </ul>
        </li>
        <li>
          <strong>Member Profile Data (Configured by Administrators):</strong>
          <ul>
            <li>
              <strong>Display Name:</strong> Your chosen or official public name
              (e.g., &ldquo;Jane Doe&rdquo;).
            </li>
            <li>
              <strong>Normalized Email Address:</strong> Used as the unique
              identifier to grant access.
            </li>
            <li>
              <strong>Account Lifecycle Status:</strong> <code>active</code> or{' '}
              <code>deactivated</code>.
            </li>
            <li>
              <strong>Authorization Grants:</strong> Specific organizational
              authority designations, including:
              <ul>
                <li>
                  <em>Club Access:</em> Associations with designated student
                  clubs (e.g., Biology Course Union, Chemistry Society).
                </li>
                <li>
                  <em>Board Member Status:</em> Your official executive or board
                  title (e.g., &ldquo;Vice President of Finance&rdquo;).
                </li>
                <li>
                  <em>Administrator Status:</em> Authority to manage members,
                  clubs, resources, and events.
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>

      <h3>C. Office Hours &amp; Calendar Bookings</h3>
      <ul>
        <li>
          <strong>Booking Records:</strong> When a Board Member reserves an
          Office Hours shift, the system records the date, time slot, and a
          snapshot of the Member&rsquo;s <strong>Display Name</strong> and{' '}
          <strong>Board Position</strong>.
        </li>
        <li>
          <em>Public Visibility:</em> The current and upcoming week&rsquo;s
          Office Hours calendar is publicly visible to all visitors so that TMU
          students know when student leaders are available in person for drop-in
          support.
        </li>
      </ul>

      <h3>D. Club &amp; Event Management Data</h3>
      <ul>
        <li>
          <strong>Club Information:</strong> Club short name, full name, and
          club contact email address.
        </li>
        <li>
          <strong>Event Listings:</strong> Event title, description, start and
          end timestamps, physical location (e.g., campus room or address),
          owning club, and collaborating organizing clubs.
        </li>
        <li>
          <em>Public Exposure:</em> Event listings have no draft state; when
          created, event details are immediately published to the
          unauthenticated public Events API (<code>GET /api/v1/events</code>)
          for consumption by student-facing feeds and campus screens.
        </li>
        <li>
          <em>Internal Attribution:</em> The system records the creating and
          editing Member IDs for internal accountability. This personal
          attribution is <strong>confidential and strictly excluded</strong>{' '}
          from the public Events API.
        </li>
      </ul>

      <h3>E. Administrative Audit Logs</h3>
      <ul>
        <li>
          Under our institutional governance architecture, privileged
          administrative mutations (such as adding or modifying members,
          assigning board positions, or archiving clubs) generate an immutable
          audit log entry.
        </li>
        <li>
          <strong>Audit Data Collected:</strong> <code>actorEmail</code> (email
          of the administrator taking the action), <code>action</code>,{' '}
          <code>targetType</code>, <code>targetId</code>,{' '}
          <code>changedValues</code> (JSON diff of modified fields), and the
          exact timestamp.
        </li>
      </ul>

      <h2>4. How We Use Your Information</h2>
      <p>
        We process personal information only for legitimate educational,
        operational, and governance purposes:
      </p>
      <ul>
        <li>
          <strong>Authentication &amp; Authorization:</strong> Verifying your
          identity through Google to ensure that only pre-approved student
          leaders and representatives access club and organizational records.
        </li>
        <li>
          <strong>Operations &amp; Scheduling:</strong> Displaying scheduled
          Office Hours so science students can drop in to consult USSTM board
          representatives.
        </li>
        <li>
          <strong>Campus Event Dissemination:</strong> Distributing details of
          upcoming academic, networking, and social events organized by USSTM
          and affiliated science clubs.
        </li>
        <li>
          <strong>Institutional Accountability:</strong> Maintaining an
          immutable audit log of privileged administrative actions to protect
          organizational integrity and prevent unauthorized changes.
        </li>
        <li>
          <strong>System Security &amp; Stability:</strong> Detecting and
          mitigating abuse, unauthorized access attempts, server errors, and
          technical anomalies.
        </li>
      </ul>

      <h2>5. Google API Services User Data Policy Compliance</h2>
      <p>
        The USSTM Portal complies with the{' '}
        <strong>Google API Services User Data Policy</strong>, including the{' '}
        <strong>Limited Use</strong> requirements:
      </p>
      <ul>
        <li>
          <strong>Specific Use:</strong> Our use and transfer of information
          received from Google APIs to any other app adheres to the{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </li>
        <li>
          <strong>No Data Transfers for Advertising:</strong> Data obtained from
          Google APIs (your verified email address) is never transferred to
          external parties, data brokers, or advertising networks.
        </li>
        <li>
          <strong>No Retargeting or Marketing:</strong> We do not use Google
          user data to serve advertisements, profile individuals, or send
          unsolicited marketing.
        </li>
        <li>
          <strong>Human Review Restrictions:</strong> Humans cannot inspect or
          read your raw Google authentication data unless you have given
          explicit consent for troubleshooting, it is necessary for security
          purposes, or it is strictly required by applicable law or university
          policy.
        </li>
      </ul>

      <h2>6. Cookies and Storage Technologies</h2>
      <p>
        The Portal uses only strictly necessary, functional cookies to support
        authentication and security:
      </p>
      <div className="overflow-x-auto my-6">
        <table className="w-full text-left border-collapse border border-border">
          <thead>
            <tr className="bg-secondary/40">
              <th className="p-3 border border-border font-semibold">
                Cookie Name / Type
              </th>
              <th className="p-3 border border-border font-semibold">
                Purpose
              </th>
              <th className="p-3 border border-border font-semibold">
                Lifespan
              </th>
              <th className="p-3 border border-border font-semibold">Scope</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border border-border font-medium">
                Session Cookie (<code>usstm_portal_session</code>)
              </td>
              <td className="p-3 border border-border">
                Asymmetrically signed JSON Web Token (JWT) verifying your
                authenticated email and authority.
              </td>
              <td className="p-3 border border-border">
                8 hours (Strictly enforced, non-sliding)
              </td>
              <td className="p-3 border border-border">
                Host-only, <code>HttpOnly</code>, <code>Secure</code>,{' '}
                <code>SameSite=Lax</code>
              </td>
            </tr>
            <tr>
              <td className="p-3 border border-border font-medium">
                OAuth State / PKCE Cookies
              </td>
              <td className="p-3 border border-border">
                Temporary cryptographic nonce and code verifier to prevent CSRF
                during sign-in.
              </td>
              <td className="p-3 border border-border">
                Single sign-in attempt (Minutes)
              </td>
              <td className="p-3 border border-border">
                Host-only, <code>HttpOnly</code>, <code>Secure</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We <strong>do not</strong> use cookies for analytics, tracking across
        third-party websites, or advertising.
      </p>

      <h2>7. How We Share or Disclose Information</h2>
      <p>
        We do not sell, rent, lease, or monetize your personal information. We
        disclose data only under the following specific circumstances:
      </p>
      <ul>
        <li>
          <strong>Publicly Visible Operational Features:</strong> Board
          Members&rsquo; display names and board titles on the Office Hours
          calendar, and event listings on the public Events API (
          <code>GET /api/v1/events</code>).
        </li>
        <li>
          <strong>Internal USSTM Administration:</strong> Authorized
          Administrators and the deployment Superuser can view member rosters,
          club associations, and administrative audit logs for governance
          purposes.
        </li>
        <li>
          <strong>Infrastructure &amp; Service Providers:</strong> Google LLC
          (Identity Services for OAuth 2.0) and our self-hosted virtual private
          server in Canada with encrypted off-host automated disaster recovery
          backups.
        </li>
        <li>
          <strong>Legal &amp; Safety Requirements:</strong> If required by
          applicable law, a valid subpoena, court order, or university
          governance policy, or to protect the safety and security of USSTM and
          TMU students.
        </li>
      </ul>

      <h2>8. Data Retention, Deactivation &amp; Deletion Policy</h2>
      <p>Under our institutional records architecture:</p>
      <ol>
        <li>
          <strong>Deactivation Instead of Permanent Deletion:</strong> When a
          Member graduates, leaves USSTM, or is removed, their profile is marked
          as{' '}
          <strong>
            <code>deactivated</code>
          </strong>{' '}
          rather than permanently deleted. Sign-in is immediately blocked, all
          authority grants are revoked, and future bookings are canceled.
        </li>
        <li>
          <strong>Historical Accountability:</strong> Historical Office Hours
          shift bookings, event authorship records, and administrative audit
          entries remain intact to support student union financial transparency,
          governance accountability, and audit compliance.
        </li>
        <li>
          <strong>Past Booking Snapshots:</strong> Bookings retain a static
          snapshot of the Member&rsquo;s Display Name and Board Position at the
          time of booking so past calendar records remain stable.
        </li>
        <li>
          <strong>Server Diagnostics &amp; Backups:</strong> Server access logs
          are routinely rotated and retained for 30 to 90 days. Encrypted
          automated database backups follow our disaster recovery backup
          schedule.
        </li>
      </ol>

      <h2>9. Data Security Safeguards</h2>
      <p>
        We implement modern, defense-in-depth technical and organizational
        measures to safeguard your personal data:
      </p>
      <ul>
        <li>
          <strong>Transport Security:</strong> All traffic is encrypted in
          transit using TLS 1.3 / HTTPS terminated via Caddy.
        </li>
        <li>
          <strong>Asymmetric Key Cryptography:</strong> Authentication cookies
          are signed asymmetrically via private key on the auth microservice and
          verified via public key on the portal.
        </li>
        <li>
          <strong>Strict Boundary Validation:</strong> All incoming data is
          sanitized and validated using Zod schemas and parameterized SQL
          queries via Drizzle ORM.
        </li>
        <li>
          <strong>Origin &amp; CSRF Defense:</strong> Strict origin validation
          and <code>SameSite=Lax</code> cookie policies protect all server
          mutations.
        </li>
        <li>
          <strong>Role-Based Authorization:</strong> Authorization checks are
          performed server-side on every individual request directly against
          database records.
        </li>
      </ul>

      <h2>10. Your Rights &amp; Contact Information</h2>
      <p>
        Under Canadian privacy legislation and USSTM governance standards, you
        have rights regarding your personal information:
      </p>
      <ul>
        <li>
          <strong>Right to Inquire &amp; Access:</strong> You may request to
          review what personal data USSTM holds regarding your membership or
          club representation.
        </li>
        <li>
          <strong>Right to Rectification:</strong> If your display name, club
          contact email, or associated details are inaccurate or out of date,
          you may request an update by contacting an Administrator.
        </li>
      </ul>
      <p>
        If you have questions about how your data is handled or wish to submit a
        privacy concern, please contact:
      </p>
      <div className="bg-card border border-border rounded-lg p-5 my-4">
        <p className="font-semibold text-foreground mb-1">
          Undergraduate Science Society of TMU (USSTM)
        </p>
        <p className="text-muted-foreground text-sm">
          40 Gould Street, Toronto, ON M5B 2K3, Canada
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Contact the USSTM Tech Committee through your student representative
          or via the portal contact page.
        </p>
      </div>

      <h2>11. Changes to this Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes
        in our operational procedures, technical architecture, or legal
        requirements. Any modifications will be posted to this page with an
        updated &ldquo;Last Updated&rdquo; date.
      </p>
    </LegalLayout>
  )
}
