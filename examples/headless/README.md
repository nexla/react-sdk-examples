# Headless example

**Full control over every pixel — no SDK components, no Radix UI.** `useConnectorForm` loads the
fields, applies conditional visibility/defaults, validates, runs OAuth, and submits; you render
every element yourself. Same look and feel as the playground — just this one pattern.

## Run it

```bash
npm install                    # installs @nexla/react-sdk from public npm
cp .env.example .env.local     # fill in your Nexla service key / application id / end-user id
npm run dev                    # http://localhost:3000
```

## What to read

`src/App.tsx` is split into two clearly-fenced parts:

- **SDK USAGE** — what you'd copy: `useConnectorForm(connectorKey)` driving a fully custom form.
  `RawField` renders each input with plain HTML, OAuth connectors show an authorize step, and
  `submit()` saves the credential. No SDK components, so **no Radix UI dependency**.
- **Demo scaffolding** — theme + page chrome (header, dark-mode toggle, footer). Identical across
  all the examples and the playground; safe to ignore.

For a drop-in UI instead, see the `styled` example.
