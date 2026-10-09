# `@nexla/react-sdk` — examples

Runnable example apps for **`@nexla/react-sdk`**. Each example installs the **published**
package (not SDK source) and demonstrates an SDK workflow or rendering pattern. New to the SDK? Start at
**[docs.nexla.com/reference/react-sdk](https://docs.nexla.com/reference/react-sdk)**.

## Which example?

| Example | Shows | Start here if… |
|---|---|---|
| [`examples/styled`](./examples/styled) | Drop-in components — a `NexlaConnectorCard` grid + `NexlaConnectModal` + theme | you want the fastest path and are happy for the SDK to render the UI |
| [`examples/headless`](./examples/headless) | `useConnectorForm` + your own HTML/CSS, no SDK-rendered controls | you need full control over every pixel |
| [`examples/playground`](./examples/playground) | Everything in one app (styled + hybrid + headless + file upload) — mirrors the SDK's internal dev playground | you want to explore the whole SDK at once |
| [`examples/embed-form`](./examples/embed-form) | `NexlaEmbedForm` or custom hook-based UI for one connector or credential, without a catalog | you want to create a credential directly or edit one by ID |

Each folder is a **standalone app** with its own `README`, dependencies, and run steps — read
the one you need; you don't need the others.

## Running an example

`cd` into the example, then:

```bash
npm install       # installs @nexla/react-sdk from public npm
npm run dev       # start the app (http://localhost:3000)
```

Then set your Nexla config: copy `.env.example` → `.env.local`. The managed-user examples
use a service key, application id, end-user id, and connectors. The embed-form example
also supports a user bearer token without application/end-user scope. See each README.

> These examples track the latest **1.0 release candidate** of `@nexla/react-sdk` (pinned in each
> example's `package.json`). They'll move to the stable `1.0` line when it ships.

## About this repo

- Examples install the published `@nexla/react-sdk` — there's **no SDK source here** (it lives
  in a separate repository).
- **Not accepting external contributions yet** — this is a read/fork reference.
- Licensed under [Apache-2.0](./LICENSE). "Nexla" is a trademark of Nexla, Inc. — see
  [NOTICE](./NOTICE); the license grants no rights to the Nexla name or brand.
