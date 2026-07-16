# Expose Events through a public API

Event visibility is public rather than restricted to authenticated Members or participating Clubs. The portal will expose an unauthenticated API that returns past and future Events so external USSTM surfaces can consume a common event list, with optional `from` and `to` timestamp filters for bounded queries. Events have no draft state: creation publishes them immediately, while modification remains governed by Club Access and Administrator authority.

Each public Event includes its stable ID, title, description, location, address, start and end timestamps, and the IDs and names of its Owning Club and Organizing Clubs. Personal audit information, including the Members who created or edited the Event, is not public.

The feed accepts only `GET` and `HEAD`, allows credential-free requests from any origin, and uses a short public cache lifetime. Mutation methods are not exposed on the public route.

The versioned endpoint is `GET /api/v1/events` with optional RFC 3339 `from` and `to` parameters. A bounded query returns Events that overlap the requested interval, results are ordered by start timestamp ascending, and the response shape is `{ "events": [...] }`; invalid ranges return `400`. Omitting both filters returns all Events, with no pagination initially.
