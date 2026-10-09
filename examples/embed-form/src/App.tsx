/**
 * NexlaEmbedForm example — direct credential forms without NexlaConnectProvider.
 *
 * Shows the per-connector capability end to end:
 *   1. NexlaConnect.init(...)            → a provider-free client
 *   2. client.fetchCurrentUser()          → validate the authenticated session
 *   3. NexlaEmbedForm or useConnectorForm → SDK-rendered or app-rendered form
 *
 * It also exercises all three modes:
 *   • create            — enter a connector key, no applicationId, no credentialId
 *   • find-or-create    — use a service key with applicationId and endUserId
 *   • edit by id        — enter a credentialId (optionally leave the connector blank
 *                         and let the SDK derive it from the credential)
 *
 * WHAT TO READ: initializeClient() for authentication, SdkRenderedForm() for
 * the drop-in component, and SampleCredentialBody() for the headless alternative.
 * The selectors, presets, persistence, styles, and header are demo scaffolding.
 */

import { useEffect, useId, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// ─── SDK ────────────────────────────────────────────────────────────────────
import {
  NexlaConnect,
  NexlaEmbedForm,
  NexlaThemeProvider,
  getNexlaTheme,
  useConnectorForm,
} from '@nexla/react-sdk';
import type { ConnectorSpecAuthField, Credential } from '@nexla/react-sdk';

// ============================================================================
// SDK USAGE — initialize a client; no NexlaConnectProvider is needed
// ============================================================================

async function initializeClient(config: Config, authMode: AuthMode): Promise<NexlaConnect> {
  // Pasted tokens are fixed; use getToken when your host can renew tokens.
  const client = authMode === 'user'
    ? await NexlaConnect.init({
        sessionToken: config.sessionToken,
        apiBaseUrl: config.apiBaseUrl,
      })
    : await NexlaConnect.init({
        serviceKey: config.serviceKey,
        apiBaseUrl: config.apiBaseUrl,
        endUserId: config.endUserId,
        ...(config.applicationId !== '' ? { applicationId: config.applicationId } : {}),
      });
  await client.fetchCurrentUser(); // Validate without loading a connector catalog.
  return client;
}

// ============================================================================
// DEMO SCAFFOLDING — config, styles, and controls for exploring the integration
// ============================================================================

interface Config {
  apiBaseUrl: string;
  serviceKey: string;
  sessionToken: string;
  endUserId: string;
  applicationId: string;
}

// Sample-only localStorage key for remembering non-secret convenience settings.
const LS_KEY = 'nexla-embed-form-config';

function loadConfig(): Config {
  const defaults: Config = {
    apiBaseUrl: import.meta.env.VITE_NEXLA_API_BASE_URL ?? 'https://dataops.nexla.io/nexla-api',
    serviceKey: import.meta.env.VITE_NEXLA_SERVICE_KEY ?? '',
    sessionToken: import.meta.env.VITE_NEXLA_SESSION_TOKEN ?? '',
    endUserId: import.meta.env.VITE_NEXLA_END_USER_ID ?? 'demo-user',
    applicationId: import.meta.env.VITE_NEXLA_APPLICATION_ID ?? '',
  };
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<Config>;
      return {
        ...defaults,
        ...(typeof parsed.apiBaseUrl === 'string' ? { apiBaseUrl: parsed.apiBaseUrl } : {}),
        ...(typeof parsed.endUserId === 'string' ? { endUserId: parsed.endUserId } : {}),
        ...(typeof parsed.applicationId === 'string' ? { applicationId: parsed.applicationId } : {}),
      };
    }
  } catch {
    /* ignore */
  }
  return defaults;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ui = {
  shell: { minHeight: '100vh', background: 'var(--nx-bg)', color: 'var(--nx-text)', fontFamily: 'var(--nx-font)' } as const,
  page: { maxWidth: 900, margin: '0 auto', padding: '52px 28px 80px' } as const,
  card: { background: 'var(--nx-surface)', border: '1px solid var(--nx-border)', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } as const,
  h1: { fontSize: 22, fontWeight: 700, margin: '0 0 4px' } as const,
  sub: { color: 'var(--nx-text-muted)', fontSize: 14, margin: '0 0 20px', lineHeight: 1.55 } as const,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--nx-text-secondary)', margin: '14px 0 5px' } as const,
  input: { width: '100%', padding: '10px 12px', color: 'var(--nx-text)', background: 'var(--nx-surface)', border: '1px solid var(--nx-border-input)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' } as const,
  btn: { background: 'var(--nx-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' } as const,
  btnGhost: { background: 'transparent', color: 'var(--nx-text-secondary)', border: '1px solid var(--nx-border-input)', borderRadius: 8, padding: '9px 16px', fontSize: 14, cursor: 'pointer' } as const,
  err: { color: 'var(--nx-error)', fontSize: 13, marginTop: 8 } as const,
  pill: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--nx-success-text)' } as const,
  modeButton: { background: 'var(--nx-surface-2)', color: 'var(--nx-text)', border: '1px solid var(--nx-border-input)', borderRadius: 8, padding: '9px 13px', fontSize: 13, fontWeight: 600, cursor: 'pointer' } as const,
  statusBar: { background: 'var(--nx-surface)', border: '1px solid var(--nx-border)', borderRadius: 10, padding: '11px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } as const,
};

type RenderMode = 'sdk' | 'custom';
type AuthMode = 'user' | 'managed';
type TargetMode = 'create' | 'edit';
type FormOptions = {
  credentialName?: string;
  initialValues?: Record<string, unknown>;
  lockedValues?: Record<string, unknown>;
};
type ActiveForm = { connector?: string; credentialId?: number; options: FormOptions; twin: boolean; nonce: number };

/** Parse a JSON-object text box; blank means "not set". */
function parseValues(label: string, text: string): Record<string, unknown> | undefined {
  if (text.trim() === '') return undefined;
  const parsed: unknown = JSON.parse(text);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}
const sampleQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// ─── App ────────────────────────────────────────────────────────────────────

export function App() {
  const [isDark, setIsDark] = useState(false);
  const theme = getNexlaTheme(isDark ? 'dark' : 'light');
  const [authMode, setAuthMode] = useState<AuthMode>('user');
  const [config, setConfig] = useState<Config>(loadConfig);
  const [client, setClient] = useState<NexlaConnect | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Direct target state — this workflow intentionally does not fetch a catalog.
  const [targetMode, setTargetMode] = useState<TargetMode>('create');
  const [typedKey, setTypedKey] = useState('');
  const [editCredId, setEditCredId] = useState(''); // optional credential id to edit
  const [renderMode, setRenderMode] = useState<RenderMode>('sdk');
  const [credentialName, setCredentialName] = useState('');
  const [initialText, setInitialText] = useState('');
  const [lockedText, setLockedText] = useState('');
  const [twin, setTwin] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // The form that's actually mounted (set on "Open form" so typing doesn't remount).
  const [active, setActive] = useState<ActiveForm | null>(null);
  const [result, setResult] = useState<Credential | null>(null);

  // ── Connect: init the client + validate the resulting user session ───────
  async function connect() {
    setConnecting(true);
    setConnectError(null);
    try {
      const c = await initializeClient(config, authMode);
      setClient(c);
      // Persist non-secret convenience settings only.
      localStorage.setItem(LS_KEY, JSON.stringify({
        ...config,
        serviceKey: '',
        sessionToken: '',
      }));
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : String(err));
      setClient(null);
    } finally {
      setConnecting(false);
    }
  }

  function openForm() {
    const connector = typedKey.trim();
    const credentialId = targetMode === 'edit' && editCredId.trim() !== ''
      ? Number(editCredId.trim())
      : undefined;
    if (targetMode === 'create' ? connector === '' : credentialId === undefined) return;
    let options: FormOptions;
    try {
      const initialValues = parseValues('Initial values', initialText);
      const lockedValues = parseValues('Locked values', lockedText);
      options = {
        ...(credentialName.trim() !== '' ? { credentialName } : {}),
        ...(initialValues !== undefined ? { initialValues } : {}),
        ...(lockedValues !== undefined ? { lockedValues } : {}),
      };
    } catch (error) {
      setOptionsError(error instanceof Error ? error.message : String(error));
      return;
    }
    setOptionsError(null);
    setResult(null);
    setActive({
      ...(connector !== '' ? { connector } : {}),
      ...(credentialId !== undefined ? { credentialId } : {}),
      options,
      twin,
      nonce: Date.now(),
    });
  }

  function applyRestPreset() {
    setTargetMode('create');
    setTypedKey('rest');
    setCredentialName('Acme API');
    setInitialText(JSON.stringify({ 'test.url': 'https://api.example.com/health' }, null, 2));
    setLockedText(JSON.stringify({ 'auth.type': 'API_KEY' }, null, 2));
  }

  const set = (k: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig((p) => ({ ...p, [k]: e.target.value }));

  const choiceStyle = (selected: boolean) => ({
    ...ui.modeButton,
    textAlign: 'left' as const,
    padding: 14,
    ...(selected ? {
      borderColor: 'var(--nx-primary)',
      color: 'var(--nx-text)',
      background: isDark ? 'rgba(129, 140, 248, 0.14)' : 'var(--nx-primary-light)',
      boxShadow: 'inset 0 0 0 1px var(--nx-primary)',
    } : {}),
  });

  return (
    <NexlaThemeProvider mode={isDark ? 'dark' : 'light'}>
      <div style={ui.shell}>
        <SampleHeader theme={theme} onToggle={() => setIsDark((dark) => !dark)} />

        <main style={ui.page}>
          <div style={{ color: 'var(--nx-primary)', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            Direct credential workflow
          </div>
          <h1 style={{ ...ui.h1, fontSize: 32 }}>Open exactly the credential form you need</h1>
          <p style={{ ...ui.sub, maxWidth: 700, fontSize: 16, marginTop: 10, marginBottom: 32 }}>
            Authenticate as a Nexla user or managed SDK application, then open one connector or credential directly—without loading a connector catalog.
          </p>

      {/* ── 1. Connect ─────────────────────────────────────────────────── */}
      <div style={client === null ? ui.card : ui.statusBar}>
        {client === null ? (
          <>
            <div style={{ fontSize: 12, color: 'var(--nx-primary)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Step 1</div>
            <h2 style={{ fontSize: 20, margin: '5px 0 4px' }}>Choose how to authenticate</h2>
            <p style={ui.sub}>These are alternative authentication paths. Choose the one that matches your host.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <button
                type="button"
                style={choiceStyle(authMode === 'user')}
                onClick={() => setAuthMode('user')}
              >
                <span style={{ display: 'block', fontSize: 14 }}>Authenticated Nexla user</span>
                <span style={{ display: 'block', marginTop: 4, fontSize: 12, fontWeight: 400, color: 'var(--nx-text-secondary)' }}>Use a user bearer token for direct access.</span>
              </button>
              <button
                type="button"
                style={choiceStyle(authMode === 'managed')}
                onClick={() => setAuthMode('managed')}
              >
                <span style={{ display: 'block', fontSize: 14 }}>Managed SDK application</span>
                <span style={{ display: 'block', marginTop: 4, fontSize: 12, fontWeight: 400, color: 'var(--nx-text-secondary)' }}>Use a service key and optional app/user scope.</span>
              </button>
            </div>

            <label style={ui.label}>API base URL</label>
            <input style={ui.input} value={config.apiBaseUrl} onChange={set('apiBaseUrl')} />

            {authMode === 'user' ? (
              <>
                <label style={ui.label}>User bearer token</label>
                <input style={ui.input} type="password" value={config.sessionToken} onChange={set('sessionToken')} placeholder="Bearer token" />
              </>
            ) : (
              <>
                <label style={ui.label}>Service key</label>
                <input style={ui.input} type="password" value={config.serviceKey} onChange={set('serviceKey')} placeholder="sk-…" />
                <label style={ui.label}>Application ID <span style={{ fontWeight: 400, color: 'var(--nx-text-muted)' }}>(optional)</span></label>
                <input style={ui.input} value={config.applicationId} onChange={set('applicationId')} placeholder="Required only for app-scoped find-or-create" />
                <label style={ui.label}>External end-user ID <span style={{ fontWeight: 400, color: 'var(--nx-text-muted)' }}>(required with application ID)</span></label>
                <input style={ui.input} value={config.endUserId} onChange={set('endUserId')} />
              </>
            )}
            <div style={{ marginTop: 16 }}>
              <button
                style={ui.btn}
                onClick={() => void connect()}
                disabled={connecting || (authMode === 'user' ? config.sessionToken === '' : config.serviceKey === '')}
              >
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
            </div>
            {connectError && <div style={ui.err}>{connectError}</div>}
          </>
        ) : (
          <>
            <span style={ui.pill}>
              ● Authenticated · {authMode === 'user' ? 'Nexla user' : 'managed SDK application'}
              {authMode === 'managed' && config.applicationId !== '' ? ' · app-scoped' : ''}
            </span>
            <button
              style={{ ...ui.btnGhost, padding: '6px 11px', fontSize: 12 }}
              onClick={() => { setClient(null); setActive(null); setResult(null); }}
            >
              Change authentication
            </button>
          </>
        )}
      </div>

      {/* ── 2. Choose a direct form target + rendering mode ───────────── */}
      {client !== null && (
        <div style={ui.card}>
          <div style={{ fontSize: 12, color: 'var(--nx-primary)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Step 2</div>
          <h2 style={{ fontSize: 20, margin: '5px 0 4px' }}>Choose the form target</h2>
          <p style={ui.sub}>Choose whether to create a credential for a connector or edit a credential you already know.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <button
              type="button"
              style={choiceStyle(targetMode === 'create')}
              onClick={() => { setTargetMode('create'); setActive(null); setResult(null); }}
            >
              <span style={{ display: 'block', fontSize: 14 }}>Create a credential</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12, fontWeight: 400, color: 'var(--nx-text-secondary)' }}>Choose a connector and open a new credential form.</span>
            </button>
            <button
              type="button"
              style={choiceStyle(targetMode === 'edit')}
              onClick={() => { setTargetMode('edit'); setActive(null); setResult(null); }}
            >
              <span style={{ display: 'block', fontSize: 14 }}>Edit a credential</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12, fontWeight: 400, color: 'var(--nx-text-secondary)' }}>Open an accessible credential by its ID.</span>
            </button>
          </div>

          {targetMode === 'create' ? (
            <>
              <label style={ui.label}>Connector key</label>
              <input style={ui.input} value={typedKey} onChange={(e) => setTypedKey(e.target.value)} placeholder="e.g. asana_api" />
            </>
          ) : (
            <>
              <label style={ui.label}>Credential ID</label>
              <input style={ui.input} value={editCredId} onChange={(e) => setEditCredId(e.target.value)} placeholder="e.g. 12345" inputMode="numeric" />
              <label style={ui.label}>
                Expected connector key <span style={{ fontWeight: 400, color: 'var(--nx-text-muted)' }}>(optional)</span>
              </label>
              <input style={ui.input} value={typedKey} onChange={(e) => setTypedKey(e.target.value)} placeholder="Leave blank to derive it from the credential" />
              <div style={{ color: 'var(--nx-text-muted)', fontSize: 12, lineHeight: 1.45, marginTop: 6 }}>
                If supplied, the SDK verifies that the credential belongs to this connector.
              </div>
            </>
          )}

          <div style={{ borderTop: '1px solid var(--nx-border)', marginTop: 22, paddingTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text-secondary)', marginBottom: 4 }}>Choose who renders the form</div>
            <div style={{ color: 'var(--nx-text-muted)', fontSize: 12, marginBottom: 10 }}>Both options use the same SDK form state and persistence workflow.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <button
              type="button"
              style={choiceStyle(renderMode === 'sdk')}
              onClick={() => setRenderMode('sdk')}
            >
              <span style={{ display: 'block', fontSize: 14 }}>SDK-rendered and themed</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12, fontWeight: 400, color: 'var(--nx-text-secondary)' }}>Use the SDK’s shared components and theme.</span>
            </button>
            <button
              type="button"
              style={choiceStyle(renderMode === 'custom')}
              onClick={() => setRenderMode('custom')}
            >
              <span style={{ display: 'block', fontSize: 14 }}>Sample-owned UI</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12, fontWeight: 400, color: 'var(--nx-text-secondary)' }}>Render the SDK hook state with application controls.</span>
            </button>
          </div>

          {/* Optional demonstrations: presets, locks, and multiple form instances. */}
          <div style={{ borderTop: '1px solid var(--nx-border)', marginTop: 22, paddingTop: 18, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-text-secondary)', marginBottom: 4 }}>Form options <span style={{ fontWeight: 400, color: 'var(--nx-text-muted)' }}>(optional)</span></div>
              <div style={{ color: 'var(--nx-text-muted)', fontSize: 12 }}>Advanced host integration. Passed to both render modes.</div>
            </div>
            <button type="button" style={{ ...ui.btnGhost, padding: '6px 11px', fontSize: 12, flexShrink: 0 }} onClick={applyRestPreset}>
              Custom REST preset
            </button>
          </div>
          <label style={ui.label}>Credential name</label>
          <input style={ui.input} value={credentialName} onChange={(e) => setCredentialName(e.target.value)} placeholder='Blank: default on create; unchanged on edit' />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div>
              <label style={ui.label}>Initial values <span style={{ fontWeight: 400, color: 'var(--nx-text-muted)' }}>(JSON; saved matching keys win)</span></label>
              <textarea style={{ ...ui.input, minHeight: 88, fontFamily: 'ui-monospace, monospace', fontSize: 12 }} value={initialText} onChange={(e) => setInitialText(e.target.value)} placeholder='{"test.url": "https://…"}' />
            </div>
            <div>
              <label style={ui.label}>Locked values <span style={{ fontWeight: 400, color: 'var(--nx-text-muted)' }}>(JSON; read-only, subject to filtering)</span></label>
              <textarea style={{ ...ui.input, minHeight: 88, fontFamily: 'ui-monospace, monospace', fontSize: 12 }} value={lockedText} onChange={(e) => setLockedText(e.target.value)} placeholder='{"auth.type": "API_KEY"}' />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--nx-text-secondary)', marginTop: 12 }}>
            <input type="checkbox" checked={twin} onChange={(e) => setTwin(e.target.checked)} />
            Render a second copy on the page (field ids stay unique)
          </label>
          {optionsError !== null && <div style={ui.err}>{optionsError}</div>}

          <div style={{ marginTop: 16 }}>
            <button
              style={{ ...ui.btn, opacity: targetMode === 'create' ? (typedKey.trim() === '' ? 0.55 : 1) : (editCredId.trim() === '' ? 0.55 : 1) }}
              onClick={openForm}
              disabled={targetMode === 'create' ? typedKey.trim() === '' : editCredId.trim() === ''}
            >
              {targetMode === 'create' ? 'Open create form' : 'Open credential'}
            </button>
          </div>
        </div>
      )}

      {/* ── 3. The embed form ─────────────────────────────────────────── */}
      {client !== null && active !== null && (active.twin ? ['a', 'b'] : ['a']).map((copy) => (
        <div key={`${active.nonce}-${copy}`} style={ui.card}>
          {renderMode === 'sdk' ? (
            <SdkRenderedForm
              client={client}
              target={active}
              onSuccess={setResult}
              onCancel={() => setActive(null)}
            />
          ) : (
            <QueryClientProvider client={sampleQueryClient}>
              <SampleRenderedForm
                client={client}
                target={active}
                onSuccess={setResult}
              />
            </QueryClientProvider>
          )}
        </div>
      ))}

      {/* ── 4. Result ─────────────────────────────────────────────────── */}
      {result !== null && (
        <div style={ui.card}>
          <strong>Credential saved</strong>
          <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
            {JSON.stringify({ id: result.id, name: result.name, credentials_type: result.credentials_type }, null, 2)}
          </pre>
        </div>
      )}
        </main>
      </div>
    </NexlaThemeProvider>
  );
}

// ============================================================================
// SDK USAGE — choose SDK-rendered or host-rendered forms
// ============================================================================

function SdkRenderedForm({ client, target, onSuccess, onCancel }: {
  client: NexlaConnect;
  target: Pick<ActiveForm, 'connector' | 'credentialId' | 'options'>;
  onSuccess: (credential: Credential) => void;
  onCancel: () => void;
}) {
  return (
    <NexlaEmbedForm
      client={client}
      {...(target.connector !== undefined ? { connector: target.connector } : {})}
      {...(target.credentialId !== undefined ? { credentialId: target.credentialId } : {})}
      {...target.options}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}

// Host-rendered alternative: the hook supplies fields, values, validation, OAuth,
// and persistence. Replace the sample controls with your own UI.
// App supplies QueryClientProvider for this path; NexlaEmbedForm provides its own.

function credentialConnectorKey(credential: Credential): string | undefined {
  const vendorName = credential.vendor?.name;
  if (vendorName !== undefined && vendorName !== '' && vendorName !== 'sql_runner') {
    return vendorName;
  }
  return credential.credentials_type || undefined;
}

function SampleRenderedForm({
  client,
  target,
  onSuccess,
}: {
  client: NexlaConnect;
  target: ActiveForm;
  onSuccess: (credential: Credential) => void;
}) {
  const [resolvedConnector, setResolvedConnector] = useState<string | null>(target.connector ?? null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (target.connector !== undefined) {
      setResolvedConnector(target.connector);
      return;
    }
    if (target.credentialId === undefined) return;

    let cancelled = false;
    setResolveError(null);
    void client.fetchCredentialDetail(target.credentialId).then(
      (credential) => {
        if (cancelled) return;
        const key = credentialConnectorKey(credential);
        if (key === undefined) setResolveError('Could not determine this credential’s connector.');
        else setResolvedConnector(key);
      },
      (error: unknown) => {
        if (!cancelled) {
          setResolveError(error instanceof Error ? error.message : 'Could not load the credential.');
        }
      },
    );
    return () => { cancelled = true; };
  }, [client, target.connector, target.credentialId]);

  if (resolveError !== null) return <div style={ui.err}>{resolveError}</div>;
  if (resolvedConnector === null) return <div style={ui.sub}>Loading credential…</div>;

  return (
    <SampleCredentialBody
      client={client}
      connector={resolvedConnector}
      {...(target.credentialId !== undefined ? { credentialId: target.credentialId } : {})}
      options={target.options}
      onSuccess={onSuccess}
    />
  );
}

function SampleCredentialBody({
  client,
  connector,
  credentialId,
  options,
  onSuccess,
}: {
  client: NexlaConnect;
  connector: string;
  credentialId?: number;
  options: FormOptions;
  onSuccess: (credential: Credential) => void;
}) {
  const form = useConnectorForm(connector, {
    client,
    ...(credentialId !== undefined ? { credentialId } : {}),
    ...options,
  });
  const locked = new Set(Object.keys(options.lockedValues ?? {}));
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function authorize() {
    setActionError(null);
    try {
      await form.authorize();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Authorization failed.');
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      onSuccess(await form.submit());
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Saving failed.');
    } finally {
      setSaving(false);
    }
  }

  if (form.loading) return <div style={ui.sub}>Loading connector form…</div>;
  if (form.error !== null) return <div style={ui.err}>{form.error.message}</div>;

  return (
    <form onSubmit={(event) => { void submit(event); }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nx-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Sample-owned UI · useConnectorForm
        </div>
        <h2 style={{ fontSize: 18, margin: '4px 0 0' }}>{connector}</h2>
      </div>

      {form.authTemplates.length > 1 && (
        <>
          <label style={ui.label}>Authentication method</label>
          <select
            style={ui.input}
            value={form.selectedTemplateId ?? ''}
            onChange={(event) => form.setTemplate(Number(event.target.value))}
          >
            {form.authTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.display_name ?? template.name}
              </option>
            ))}
          </select>
        </>
      )}

      {form.fields.map((field) => (
        <SampleField
          key={field.name}
          field={field}
          value={form.values[field.name]}
          error={form.errors[field.name]}
          locked={locked.has(field.name)}
          onChange={form.setValue}
        />
      ))}

      {form.isOAuth && !form.isAuthorized && (
        <button type="button" style={{ ...ui.btn, marginTop: 16 }} disabled={form.authorizing} onClick={() => { void authorize(); }}>
          {form.authorizing ? 'Authorizing…' : `Authorize ${connector}`}
        </button>
      )}

      {actionError !== null && <div style={ui.err}>{actionError}</div>}

      {(!form.isOAuth || form.isAuthorized) && (
        <button type="submit" style={{ ...ui.btn, marginTop: 16 }} disabled={saving}>
          {saving ? 'Saving…' : form.existingCredential ? 'Update credential' : 'Save credential'}
        </button>
      )}
    </form>
  );
}

// ============================================================================
// DEMO SCAFFOLDING — page chrome and sample-owned input controls
// ============================================================================

// Match the playground's page chrome without coupling the standalone demo to
// its provider setup. This is sample UI, not SDK credential-form behavior.
function SampleHeader({ theme, onToggle }: {
  theme: ReturnType<typeof getNexlaTheme>;
  onToggle: () => void;
}) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', height: 56,
      background: theme.dark ? 'rgba(15, 17, 23, 0.85)' : 'rgba(241, 245, 249, 0.85)',
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width={26} height={26 * (21.25 / 35.87)} viewBox="0 0 35.87 21.25" aria-hidden="true">
          <path fill="#6254ff" d="M2.86,15.85L.13,13.13c-.17-.17-.17-.45,0-.63L11.25,1.38c.89-.89,2.07-1.38,3.32-1.38s2.43.49,3.32,1.38l6.36,6.36c.17.17.17.45,0,.63l-2.73,2.73c-.17.17-.45.17-.63,0l-5.56-5.56c-.43-.43-1.12-.43-1.54,0L3.49,15.85c-.17.17-.45.17-.63,0Z" />
          <path fill="#6254ff" d="M21.21,21.25c-1.2,0-2.41-.46-3.32-1.37l-6.36-6.36c-.17-.17-.17-.45,0-.63l2.73-2.73c.17-.17.45-.17.63,0l5.56,5.56c.43.43,1.12.43,1.54,0l10.4-10.4c.17-.17.45-.17.63,0l2.73,2.73c.17.17.17.45,0,.63l-11.21,11.21c-.92.92-2.12,1.37-3.32,1.37Z" />
        </svg>
        <span style={{
          fontSize: 14, fontWeight: 700, letterSpacing: '0.04em',
          color: theme.textPrimary, fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>Nexla React SDK</span>
      </div>
      <button type="button" onClick={onToggle} aria-label="Toggle theme" style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px',
        borderRadius: 20, border: `1px solid ${theme.btnBorder}`, background: theme.btnBg,
        color: theme.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'color 0.15s, background 0.15s', outline: 'none',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {theme.dark ? (
            <>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </>
          ) : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />}
        </svg>
        {theme.dark ? 'Light' : 'Dark'}
      </button>
    </header>
  );
}

function SampleField({
  field,
  value,
  error,
  locked,
  onChange,
}: {
  field: ConnectorSpecAuthField;
  value: unknown;
  error: string | undefined;
  locked: boolean;
  onChange: (name: string, value: unknown) => void;
}) {
  const fieldId = useId();
  const valueString = value === undefined || value === null ? '' : String(value);
  const label = (
    <label style={ui.label} htmlFor={fieldId}>
      {field.display_name}{field.required ? ' *' : ''}{locked ? ' · locked by host' : ''}
    </label>
  );

  let control: React.ReactNode;
  if (field.type === 'boolean') {
    const checked = value === true || valueString === 'true';
    control = (
      <input
        id={fieldId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(field.name, event.target.checked)}
      />
    );
  } else if (field.type === 'file' || field.inputType === 'file') {
    control = (
      <input
        id={fieldId}
        type="file"
        accept={field.file_types}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file === undefined) return;
          const reader = new FileReader();
          reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            onChange(field.name, field.is_binary ? result.slice(result.indexOf(',') + 1) : result);
          };
          if (field.is_binary) reader.readAsDataURL(file);
          else reader.readAsText(file);
        }}
      />
    );
  } else if (field.values && field.values.length > 0) {
    control = (
      <select id={fieldId} style={ui.input} value={valueString} onChange={(event) => onChange(field.name, event.target.value)}>
        <option value="">Select…</option>
        {field.values.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    );
  } else if (field.type === 'string_multi' || field.type === 'string-multi' || field.inputType === 'textarea') {
    control = (
      <textarea
        id={fieldId}
        style={{ ...ui.input, minHeight: 96, resize: 'vertical' }}
        value={valueString}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  } else {
    const type = field.type === 'password' || field.inputType === 'password' ? 'password' : 'text';
    control = (
      <input
        id={fieldId}
        style={ui.input}
        type={type}
        value={valueString}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  return (
    <div>
      {label}
      <fieldset disabled={locked} style={{ border: 'none', margin: 0, padding: 0 }}>{control}</fieldset>
      {error !== undefined && <div style={ui.err}>{error}</div>}
    </div>
  );
}
