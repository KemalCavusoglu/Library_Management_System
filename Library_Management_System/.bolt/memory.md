# Project memory

## Product intent & audience

- Turkish-language library and study management application.
- Two primary interfaces: a **student kiosk view** for checking in/out of study sessions, and an **admin panel** for oversight, analytics, and data export.
- Admin password is a simple configurable string (currently `"e"`, initially `"1234"`); no full auth system inferred yet.
- Admin can change the password on request.

## Brand personality & voice

- App UI and all user-facing text in **Turkish**.
- Assistant communicates with the user in Turkish as well.
- Tone is helpful and direct; production-quality but pragmatic.

## Visual design & UX direction

- Framework: Vite + React, Tailwind CSS, Lucide React icons.
- Path alias `@/` → `src/`.
- Design goal: beautiful, production-worthy, non-cookie-cutter (per global prompt).
- No additional UI/icon packages beyond Lucide React unless explicitly requested.
- Kiosk view implies large, touch-friendly UI elements for student interaction.
- Admin panel includes analytics dashboards and data export tools (CSV/Excel likely).

## Decisions, constraints & rationale

- Admin password stored as a simple string value, not a hashed credential — sufficient for a local/internal tool but a constraint to revisit if security needs grow.
- Session management is automated (check-in/check-out flow handled by the kiosk).
- Data export is a core admin feature, suggesting real-world reporting needs.

## Open questions & assumptions

- Admin password mechanism: is it hardcoded, stored in state, or persisted (localStorage / backend)? Currently inferred as a mutable app value.
- No backend or database confirmed yet; persistence strategy unclear.
- Analytics scope (what metrics are tracked) not yet detailed.
- Data export format(s) not yet specified.
- Multi-admin or role-based access not yet discussed.