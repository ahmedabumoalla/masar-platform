# Installation requests

The home page opens a native RTL dialog for the applicant name, email, Saudi mobile number, Google Maps farm link, device count, farm area in square metres and crops. All seven fields are required. Success is shown only after the same-origin server endpoint confirms persistent storage. Failed requests retain the form data in component memory only; no personal data is saved to localStorage or logged.

## Storage and access

- Vercel project: `ahmedabumoallas-projects/masar-platform`
- Private Blob store: `masar-installation-requests`, `store_ZRk7KXefE7OljMLw`
- Records are JSON objects under `installation-requests/`, accessible to authorized project/store operators through Vercel Storage. They are not public links
- Each record contains the seven submitted fields, a request UUID, UTC receivedAt and status `new`. A retry with identical data and UUID resolves to the same object without overwriting it
- `BLOB_READ_WRITE_TOKEN` is managed by the project's Vercel storage connection in Production and Preview, never in browser code or Git. Never change the store to public
- No email notifications are configured. The user has not specified a notification recipient; durable intake works independently of email
- Operators should delete fulfilled/unneeded records from the private store according to their retention policy. There is no public record listing or read endpoint

## Validation and abuse controls

`POST /api/installation-requests` requires a matching Origin and JSON content type, caps the body at 12 KiB, validates fields again on the server and rejects a populated honeypot. It returns only success plus the request UUID. Provider errors return 503 without exposing details or acknowledging success.

The in-memory rate limiter permits five submissions per client per ten minutes per warm function instance, bounded to 5000 entries. It is best-effort burst protection, not a distributed quota. Vercel's platform firewall also applies; configure a durable edge rate rule or challenge if public abuse is observed. No IP addresses are persisted in records.

## Development and verification

- `npm run test:installation` verifies normalization, map-link allowlisting, numeric limits, request validation, persistence-before-success, retries, throttling and storage failure
- `npm run build` typechecks frontend, API and server modules before producing the Vite app
- `npm run dev` serves the frontend only. Use a Vercel preview with the private store, or `vercel dev` with an explicitly configured development storage connection, to exercise real submissions
- Live release checks use clearly synthetic records, verify unauthorized Blob access fails, and delete only those exact test objects afterwards
