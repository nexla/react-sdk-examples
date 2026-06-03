# Styled example

The **fastest path**: drop in the SDK's styled components and let them render the connector
grid, the credential modal, OAuth popups, and toasts. Same look and feel as the playground —
just this one pattern.

## Run it

```bash
npm install                    # installs @nexla/react-sdk from public npm
cp .env.example .env.local     # fill in your Nexla service key / application id / end-user id
npm run dev                    # http://localhost:3000
```

## What to read

`src/App.tsx` is split into two clearly-fenced parts:

- **SDK USAGE** — what you'd copy into your app: `NexlaConnectProvider` + a `NexlaConnectorCard`
  grid / `NexlaConnectButton` + `NexlaConnectModal`, wrapped in `NexlaThemeProvider`. The real
  wiring is about a dozen lines.
- **Demo scaffolding** — theme + page chrome (header, dark-mode toggle, footer). Identical across
  all the examples and the playground; safe to ignore.

For full control over the markup instead, see the `headless` example.
