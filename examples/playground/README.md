# Playground

Every integration pattern in one app — a themed page (with a dark-mode toggle) that walks
through the whole SDK in sections:

- **Styled** — `NexlaConnectorCard` grid + `NexlaConnectButton` + `NexlaConnectModal`.
- **Hybrid** — your own connector list + `NexlaConnectModal` for the credential form.
- **Headless** — `useConnectorForm` with your own inputs (no SDK components).
- **File upload** — `NexlaFileUpload` (styled) and `useFileUpload` (headless), streaming to a
  Nexla `file_upload` source URL.

This is a faithful copy of the SDK's internal dev playground — the same app, but installing the
**published** package instead of SDK source. For a single focused concern, the `styled` and
`headless` examples are smaller and easier to read.

## Run it

```bash
npm install                    # installs @nexla/react-sdk from public npm
cp .env.example .env.local     # fill in your service key / application id / end-user id (+ upload URL)
npm run dev                    # http://localhost:3000
```

## What to read
- **[`src/App.tsx`](./src/App.tsx)** — the whole showcase in one file, fenced into two parts:
  - **SDK USAGE** — one `NexlaConnectProvider` + a section per pattern (styled, hybrid, headless,
    file upload), each with a comment on what it is and which pieces are the real integration.
  - **Demo scaffolding** — theme, header, footer, shared styles. Just makes it look nice;
    identical across all the examples and safe to ignore.

## The File upload section
`NexlaFileUpload` / `useFileUpload` stream files **directly to a Nexla `file_upload` source URL**
— not a connector, and not through `apiBaseUrl`. That URL is **developer config** (carries its
own `?api_key=`), so set it via `VITE_NEXLA_FILE_UPLOAD_URL` in `.env.local`. Because the
destination is always a Nexla URL, Nexla allows the cross-origin upload (that's the use case).
