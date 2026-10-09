# NexlaEmbedForm example

Open one credential form directly, without a connector catalog or
`NexlaConnectProvider`. Authenticate, then create a credential for a connector key
or edit an existing credential by ID.

- **SDK-rendered** — `NexlaEmbedForm`, with `NexlaThemeProvider` and light/dark mode.
- **Sample-owned UI** — `useConnectorForm(connectorKey, { client })`, rendered with
  application controls. The host supplies `QueryClientProvider`.

Both use a `NexlaConnect` client and the same SDK credential workflow.

## Run it

```bash
npm install                    # installs the published SDK from public npm
cp .env.example .env.local     # optional defaults; you can also enter them in the app
npm run dev                    # http://localhost:3000
```

Choose either a Nexla user bearer token or a service key. The sample uses
`sessionToken` for a pasted token; in your application, prefer `getToken` when the
host can supply renewed tokens. Authentication values are not saved to
`localStorage`. Never commit real keys; `VITE_*` values are visible in the browser.

## Choose a target

| Input | Behavior |
| --- | --- |
| Connector key, without application scope | Create a credential |
| Connector key + service-key client with application and end-user IDs | Find the existing scoped credential or create one |
| Credential ID | Edit that credential; derive the connector when omitted |

An explicit credential ID takes precedence over discovery. An optional connector
key on edit checks that the credential belongs to the expected connector.
For example, use `gdrive`, `snowflake`, `bigquery`, `asana_api`, etc.

The optional form inputs demonstrate credential naming and advanced presets/locks.
Saved non-empty values replace matching initial values; locks are field controls,
not server authorization. Blank credential names use a default on create and leave
the existing name unchanged on edit. Most integrations need neither presets nor locks.

## What to read

- **[`src/App.tsx`](./src/App.tsx)** — look for the **SDK USAGE** sections:
  - `initializeClient()` — choose authentication and validate the session.
  - `SdkRenderedForm()` — the small drop-in `NexlaEmbedForm` integration.
  - `SampleRenderedForm()` — resolve a connector when only a credential ID is given.
  - `SampleCredentialBody()` — the hook alternative: render fields, authorize when
    needed, then save with `submit()`. `App` supplies its `QueryClientProvider`.
- **Demo scaffolding** — authentication/target selectors, styles, header, and theme
  toggle. These are sample application UI, not required SDK components.
  Presets, locks, and the second-form checkbox are optional demonstrations.

For a managed end-user connector grid and modal instead, see the
[`styled`](../styled) example or the [`playground`](../playground).
