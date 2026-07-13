create table "usstmAdministrator" (
  "email" text primary key check ("email" = lower("email")),
  "userId" text unique references "user" ("id") on delete set null,
  "createdAt" timestamptz default current_timestamp not null,
  "boundAt" timestamptz
);
