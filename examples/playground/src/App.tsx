/**
 * Nexla React SDK — playground.
 *
 * One app that walks through everything the SDK does, so you can see each integration pattern
 * working and pick the one you want. Two use cases:
 *   1. Connect data systems — Styled (drop-in), Hybrid (your list + SDK modal), Headless (your UI).
 *   2. File upload — stream files straight to a Nexla file_upload source.
 *
 * HOW TO READ THIS FILE
 *   • SDK USAGE        — the provider + the per-pattern sections. This is what you'd lift into
 *                        your own app; each section is one self-contained pattern.
 *   • Demo scaffolding — theme, header, footer, icons, shared styles. Just makes the playground
 *                        look nice; it's identical across the examples and you can ignore it.
 *
 * (The focused `styled` and `headless` examples are slices of this same file.)
 */

import React, { useState } from 'react';
import {
  NexlaConnectProvider,
  NexlaThemeProvider,
  NexlaConnectButton,
  NexlaConnectorCard,
  NexlaConnectModal,
  NexlaSnackbar,
  useNexlaConnect,
  useConnectorForm,
  NexlaFileUpload,
  useFileUpload,
  useNexlaSnackbar,
  getNexlaTheme
} from '@nexla/react-sdk';
import type { ConnectorSpecAuthField, UseNexlaSnackbarResult } from '@nexla/react-sdk';

// ============================================================================
//  SDK USAGE — the parts you'd copy into your own app.
// ============================================================================

// Developer config — from .env.local (see .env.example). Not entered by end users.
const NEXLA_API_BASE_URL =
  (import.meta.env['VITE_NEXLA_API_BASE_URL'] as string | undefined) ??
  'https://dataops.nexla.io/nexla-api';
const ENABLED_CONNECTORS = ['gdrive', 'notion_api', 'sf_api', 'hub_api', 's3', 'asana_api', 'box'];
const SERVICE_KEY = (import.meta.env['VITE_NEXLA_SERVICE_KEY'] as string | undefined) ?? '';
const APPLICATION_ID =
  (import.meta.env['VITE_NEXLA_APPLICATION_ID'] as string | undefined) ??
  'missing-VITE_NEXLA_APPLICATION_ID';
const END_USER_ID =
  (import.meta.env['VITE_NEXLA_END_USER_ID'] as string | undefined) ?? 'demo-user';
// File-upload destination — a Nexla file_upload source URL (carries its own ?api_key=).
const FILE_UPLOAD_URL = (import.meta.env['VITE_NEXLA_FILE_UPLOAD_URL'] as string | undefined) ?? '';

// Root: one <NexlaConnectProvider> wraps the app; everything inside reads from it. The sections
// below each render a different integration pattern.
export function App() {
  const [isDark, setIsDark] = useState(true);
  const theme = getNexlaTheme(isDark ? 'dark' : 'light');
  const snackbar = useNexlaSnackbar();

  return (
    <NexlaConnectProvider
      apiBaseUrl={NEXLA_API_BASE_URL}
      serviceKey={SERVICE_KEY}
      connectors={ENABLED_CONNECTORS}
      applicationId={APPLICATION_ID}
      endUserId={END_USER_ID}
      onConnect={snackbar.onConnect}
      onError={snackbar.onError}>
      <div
        style={{
          minHeight: '100vh',
          background: theme.bg,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          transition: 'background 0.2s'
        }}>
        <StickyHeader theme={theme} onToggle={() => setIsDark((d) => !d)} />
        <main
          style={{
            maxWidth: 900,
            margin: '0 auto'
          }}>
          <PartHeading
            theme={theme}
            part="Use Case 1 — Connect data systems"
            title="Connect your users' data systems"
            blurb="Let your end users connect their accounts — Salesforce, Google Drive, Notion, and hundreds more — right inside your product, so data flows in and out automatically."
          />
          <StyledSection theme={theme} onProbeError={snackbar.onProbeError} />
          <HybridSection theme={theme} />
          <HeadlessSection theme={theme} />

          <PartHeading
            theme={theme}
            part="Use Case 2 — Upload files"
            title="Let your users upload files"
            blurb="Let your end users drop files straight into a Nexla flow you already created — no connector to wire up, no credential to manage. The SDK streams each file to your upload URL with live per-file progress, while Nexla moves the data behind the scenes."
          />
          <FileUploadStyledSection theme={theme} isDark={isDark} />
          <FileUploadHeadlessSection theme={theme} />
        </main>
        <Footer theme={theme} />
      </div>
      <NexlaThemeProvider mode={isDark ? 'dark' : 'light'}>
        <NexlaSnackbar {...snackbar.snackbarProps} />
      </NexlaThemeProvider>
    </NexlaConnectProvider>
  );
}

// ── Use case 1: connect data systems ───────────────────────────────────────
// Three ways to let users connect accounts — pick the one that fits how much UI you want to own.

// Pattern 1 — Styled: drop-in SDK components render the whole experience (grid, modal, OAuth).
// Least code; the SDK owns the UI.
function StyledSection({
  theme,
  onProbeError
}: {
  theme: Theme;
  onProbeError: UseNexlaSnackbarResult['onProbeError'];
}) {
  const { connectors, loading, error } = useNexlaConnect();
  const [openConnectorKey, setOpenConnectorKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <NexlaThemeProvider mode={theme.dark ? 'dark' : 'light'}>
      <section style={sectionStyles(theme, true)}>
        <p style={labelStyle(theme)}>Pattern 1 — Styled</p>
        <h2 style={titleStyle(theme)}>Drop-in SDK components</h2>
        <p style={subtitleStyle(theme)}>
          Use <code style={codeStyle(theme)}>NexlaConnectorCard</code> for a
          connector grid and{' '}
          <code style={codeStyle(theme)}>NexlaConnectButton</code> for a
          self-contained connect button. Wrap with{' '}
          <code style={codeStyle(theme)}>NexlaThemeProvider</code> for the Nexla
          brand.
        </p>

        {loading && (
          <p style={{ color: theme.textMuted, fontSize: 14, margin: 0 }}>
            Loading…
          </p>
        )}
        {error && (
          <p style={{ color: theme.errorText, fontSize: 14, margin: 0 }}>
            {error.message}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 12
          }}>
          <div
            style={{
              display: 'inline-flex',
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
              overflow: 'hidden'
            }}>
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  border: 'none',
                  background: viewMode === mode ? theme.accent : 'transparent',
                  color: viewMode === mode ? '#fff' : theme.textSecondary,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  transition: 'background 0.15s, color 0.15s'
                }}>
                {mode === 'grid' ? <GridIcon /> : <ListIcon />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div
          style={
            viewMode === 'grid'
              ? {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 12,
                  marginBottom: 24
                }
              : {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginBottom: 24
                }
          }>
          {connectors.map((connector) => (
            <NexlaConnectorCard
              key={connector.name}
              connector={connector}
              viewMode={viewMode}
              onClick={(c) => setOpenConnectorKey(c.name)}
            />
          ))}
        </div>

        <p
          style={{
            margin: '0 0 16px',
            fontSize: 12,
            color: theme.textMuted,
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
          — or use the all-in-one button —
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {connectors.map((connector) => (
            <NexlaConnectButton key={connector.name} connector={connector.name}>
              Connect {connector.display_name}
            </NexlaConnectButton>
          ))}
        </div>

        {openConnectorKey !== null && (
          <NexlaConnectModal
            open={true}
            connector={openConnectorKey}
            onClose={() => setOpenConnectorKey(null)}
            onProbeError={onProbeError}
          />
        )}
      </section>
    </NexlaThemeProvider>
  );
}

// Pattern 2 — Hybrid: your own connector list markup + the SDK's <NexlaConnectModal> for the
// credential form. You own discovery/layout; the SDK owns the form.
function HybridSection({ theme }: { theme: Theme }) {
  const { connectors, loading, error } = useNexlaConnect();
  const [openConnectorKey, setOpenConnectorKey] = useState<string | null>(null);

  return (
    <NexlaThemeProvider mode={theme.dark ? 'dark' : 'light'}>
      <section style={sectionStyles(theme, true)}>
        <p style={labelStyle(theme)}>Pattern 2 — Hybrid</p>
        <h2 style={titleStyle(theme)}>Best of both worlds</h2>
        <p style={subtitleStyle(theme)}>
          Mix and match SDK components with your own custom UI as needed. Here,
          we use a custom connector card list with NexlaConnectModal for
          credential creation — but you can use the hooks and components in any
          combination you like.
        </p>

        {loading && (
          <p style={{ color: theme.textMuted, fontSize: 14, margin: 0 }}>
            Loading…
          </p>
        )}
        {error && (
          <p style={{ color: theme.errorText, fontSize: 14, margin: 0 }}>
            {error.message}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {connectors.map((connector) => {
            const active = openConnectorKey === connector.name;

            return (
              <div
                key={connector.name}
                onClick={() =>
                  setOpenConnectorKey(active ? null : connector.name)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpenConnectorKey(active ? null : connector.name);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  border: `1px solid '#334155'`,
                  background: theme.dark ? '#4f5660' : '#e0dfe5',
                  cursor: 'pointer',
                  flex: '0 0 100%'
                }}>
                {connector.logo && (
                  <img
                    src={connector.logo}
                    alt={`${connector.display_name} logo`}
                    style={{
                      width: 32,
                      height: 32,
                      objectFit: 'contain',
                      borderRadius: 4,
                      flexShrink: 0
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--nx-text, #111827)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                    Connect [Our Platform] to {connector.display_name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {openConnectorKey !== null && (
        <NexlaConnectModal
          open={true}
          connector={openConnectorKey}
          onClose={() => setOpenConnectorKey(null)}
        />
      )}
    </NexlaThemeProvider>
  );
}

// Pattern 3 — Headless: useConnectorForm() gives you fields, validation, OAuth, and submit() —
// you render every element. The three helpers below are THIS demo's rendering (your code), not
// the SDK: HeadlessForm/HeadlessCredentialBody build the form, RawField renders one input.
function HeadlessSection({ theme }: { theme: Theme }) {
  const { connectors, loading, error } = useNexlaConnect();
  const [openConnectorKey, setOpenConnectorKey] = useState<string | null>(null);

  return (
    <section style={sectionStyles(theme)}>
      <p style={labelStyle(theme)}>Pattern 3 — Headless</p>
      <h2 style={titleStyle(theme)}>Bring your own UI</h2>
      <p style={subtitleStyle(theme)}>
        Use <code style={codeStyle(theme)}>useConnectorForm</code> to load
        fields and manage state, then render with any HTML elements you choose —
        no SDK UI components required.
      </p>

      {loading && (
        <p style={{ color: theme.textMuted, fontSize: 14, margin: 0 }}>
          Loading…
        </p>
      )}
      {error && (
        <p style={{ color: theme.errorText, fontSize: 14, margin: 0 }}>
          {error.message}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {connectors.map((connector) => {
          const active = openConnectorKey === connector.name;
          return (
            <button
              key={connector.name}
              onClick={() =>
                setOpenConnectorKey(active ? null : connector.name)
              }
              style={{
                padding: '6px 14px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12,
                fontWeight: 500,
                border: `1px solid ${active ? '#818cf8' : '#334155'}`,
                borderRadius: 4,
                background: active ? '#1e1b4b' : 'transparent',
                color: active ? '#818cf8' : '#64748b',
                cursor: 'pointer'
              }}>
              {active ? '▾ ' : '▸ '}
              {connector.display_name}
            </button>
          );
        })}
      </div>

      {openConnectorKey !== null && (
        <HeadlessForm connectorKey={openConnectorKey} />
      )}
    </section>
  );
}

function HeadlessForm({ connectorKey }: { connectorKey: string }) {
  return <HeadlessCredentialBody connectorKey={connectorKey} />;
}

function HeadlessCredentialBody({ connectorKey }: { connectorKey: string }) {
  const form = useConnectorForm(connectorKey);
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [statusMsg, setStatusMsg] = useState('');

  async function handleAuthorize() {
    try {
      await form.authorize();
    } catch {
      // oauthError is set on the hook; nothing extra to do here
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      const cred = await form.submit();
      setStatus('success');
      setStatusMsg(`Credential #${cred.id} saved`);
    } catch (err) {
      setStatus('error');
      setStatusMsg(err instanceof Error ? err.message : 'Submission failed');
    }
  }

  const terminalBox: React.CSSProperties = {
    marginTop: 20,
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    borderRadius: 6,
    overflow: 'hidden'
  };

  const terminalBar: React.CSSProperties = {
    padding: '6px 14px',
    background: '#161b22',
    borderBottom: '1px solid #1e2d3d',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    color: '#4a90d9',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  };

  const monoText: React.CSSProperties = {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13
  };

  const basicFields = form.fields.filter((f) => f.group !== 'advanced');
  const advancedFields = form.fields.filter((f) => f.group === 'advanced');

  // Show the form body when we have fields to render, or it's OAuth (the authorize button is the body)
  const hasContent =
    !form.loading && !form.error && (basicFields.length > 0 || form.isOAuth);

  return (
    <div style={terminalBox}>
      <div style={terminalBar}>
        <span style={{ color: '#ef4444', fontSize: 8 }}>●</span>
        <span style={{ color: '#f59e0b', fontSize: 8 }}>●</span>
        <span style={{ color: '#22c55e', fontSize: 8 }}>●</span>
        <span style={{ marginLeft: 4 }}>
          useConnectorForm(
          <span style={{ color: '#e2e8f0' }}>"{connectorKey}"</span>)
        </span>
      </div>

      <div style={{ padding: 20 }}>
        {form.loading && (
          <p style={{ ...monoText, color: '#64748b', margin: 0 }}>
            // loading fields…
          </p>
        )}
        {form.error && (
          <p style={{ ...monoText, color: '#f87171', margin: 0 }}>
            // error: {form.error.message}
          </p>
        )}

        {form.authTemplates.length > 1 && (
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
            <label style={{ ...monoText, fontSize: 12, color: '#64748b' }}>
              // authentication type
            </label>
            <select
              value={form.selectedTemplateId ?? ''}
              onChange={(e) => form.setTemplate(Number(e.target.value))}
              style={{
                padding: '7px 10px',
                ...monoText,
                background: '#0d1117',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: 4
              }}>
              {form.authTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.display_name ?? t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!form.loading &&
          !form.isOAuth &&
          basicFields.length === 0 &&
          !form.error && (
            <p style={{ ...monoText, color: '#64748b', margin: 0 }}>
              // no fields — select a template above
            </p>
          )}

        {hasContent && (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Regular form fields */}
            {basicFields.map((f) => (
              <RawField
                key={f.name}
                field={f}
                value={form.values[f.name]}
                {...(form.errors[f.name] !== undefined
                  ? { error: form.errors[f.name] }
                  : {})}
                onChange={(v) => form.setValue(f.name, v)}
              />
            ))}

            {advancedFields.length > 0 && (
              <>
                <span
                  style={{
                    ...monoText,
                    fontSize: 11,
                    color: '#475569',
                    marginTop: 4
                  }}>
                  // advanced settings
                </span>
                {advancedFields.map((f) => (
                  <RawField
                    key={f.name}
                    field={f}
                    value={form.values[f.name]}
                    {...(form.errors[f.name] !== undefined
                      ? { error: form.errors[f.name] }
                      : {})}
                    onChange={(v) => form.setValue(f.name, v)}
                  />
                ))}
              </>
            )}

            {/* OAuth authorize block — always at the bottom */}
            {form.isOAuth && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: '14px 16px',
                  background: '#0d1117',
                  border: `1px solid ${form.isAuthorized ? '#166534' : '#334155'}`,
                  borderRadius: 4,
                  marginTop: 4
                }}>
                <span style={{ ...monoText, fontSize: 12, color: '#64748b' }}>
                  // oauth2 authorization
                </span>

                {form.isAuthorized || form.existingCredential !== undefined ? (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
                    <span
                      style={{ ...monoText, fontSize: 13, color: '#4ade80' }}>
                      {form.isAuthorized
                        ? 'authorized — ready to save'
                        : `connected — credential #${form.existingCredential!.id}`}
                    </span>
                    <button
                      type="button"
                      onClick={handleAuthorize}
                      style={{
                        marginLeft: 'auto',
                        padding: '4px 10px',
                        ...monoText,
                        fontSize: 11,
                        background: 'transparent',
                        color: '#475569',
                        border: '1px solid #334155',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}>
                      re-authorize
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAuthorize}
                    disabled={form.authorizing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '9px 16px',
                      ...monoText,
                      fontWeight: 600,
                      background: form.authorizing ? '#1e2d3d' : '#312e81',
                      color: form.authorizing ? '#475569' : '#818cf8',
                      border: '1px solid #3730a3',
                      borderRadius: 4,
                      cursor: form.authorizing ? 'not-allowed' : 'pointer',
                      opacity: form.authorizing ? 0.8 : 1
                    }}>
                    {form.authorizing ? (
                      <>
                        <OAuthSpinner />
                        // authorizing…
                      </>
                    ) : (
                      <>
                        <LockIcon />
                        // authorize()
                      </>
                    )}
                  </button>
                )}

                {form.oauthError !== null && (
                  <span style={{ ...monoText, fontSize: 11, color: '#f87171' }}>
                    // error: {form.oauthError}
                  </span>
                )}
              </div>
            )}

            {/* Connected indicator for non-OAuth connectors (Notion, S3, gdrive
                service-account, …) that already have a credential. The OAuth block
                above shows its own badge; this covers the non-OAuth path so any
                connector with form.existingCredential reads as connected. */}
            {!form.isOAuth && form.existingCredential !== undefined && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  background: '#0d1117',
                  border: '1px solid #166534',
                  borderRadius: 4,
                  marginTop: 4
                }}>
                <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
                <span style={{ ...monoText, fontSize: 13, color: '#4ade80' }}>
                  connected — credential #{form.existingCredential.id}
                </span>
              </div>
            )}

            {/* Submit — show for non-OAuth always, for OAuth after authorization or when editing existing */}
            {(!form.isOAuth ||
              form.isAuthorized ||
              form.existingCredential !== undefined) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 4
                }}>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    padding: '8px 20px',
                    ...monoText,
                    fontWeight: 600,
                    background: status === 'submitting' ? '#1e2d3d' : '#818cf8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                    opacity: status === 'submitting' ? 0.7 : 1
                  }}>
                  {status === 'submitting'
                    ? '// saving…'
                    : form.existingCredential !== undefined
                      ? '// update()'
                      : '// submit()'}
                </button>
                {status === 'success' && (
                  <span style={{ ...monoText, fontSize: 12, color: '#22c55e' }}>
                    ✓ {statusMsg}
                  </span>
                )}
                {status === 'error' && (
                  <span style={{ ...monoText, fontSize: 12, color: '#f87171' }}>
                    ✕ {statusMsg}
                  </span>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function RawField({
  field,
  value,
  error,
  onChange
}: {
  field: ConnectorSpecAuthField;
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
}) {
  const str = value !== undefined && value !== null ? String(value) : '';
  const hasError = error !== undefined && error !== '';

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
    border: `1px solid ${hasError ? '#f87171' : '#334155'}`,
    borderRadius: 4,
    background: '#0d1117',
    color: '#e2e8f0',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const selectOptions = (field.values ?? field.options ?? []).map((v) =>
    typeof v === 'string' ? { label: v, value: v } : v
  );

  let input: React.ReactNode;

  if (selectOptions.length > 0) {
    input = (
      <select
        value={str}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputBase, cursor: 'pointer' }}>
        <option value="">— select —</option>
        {selectOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'boolean') {
    input = (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer'
        }}>
        <input
          type="checkbox"
          checked={value === true || value === 'true'}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: 14, height: 14, accentColor: '#818cf8' }}
        />
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            color: '#94a3b8'
          }}>
          {field.display_name}
        </span>
      </label>
    );
  } else {
    const inputType =
      field.inputType === 'password' || field.type === 'password'
        ? 'password'
        : field.type === 'int'
          ? 'number'
          : 'text';
    input = (
      <input
        type={inputType}
        value={str}
        placeholder={field.placeholder ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={inputBase}
        // Opt out of browser / password-manager autofill — credential fields are only
        // populated by the SDK (spec defaults + existing-credential prefill).
        autoComplete={inputType === 'password' ? 'new-password' : 'off'}
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        data-form-type="other"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {field.type !== 'boolean' && (
        <label
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            color: '#64748b'
          }}>
          {field.display_name}
          {field.required === true && (
            <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>
          )}
        </label>
      )}
      {input}
      {hasError && (
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
            color: '#f87171'
          }}>
          {error}
        </span>
      )}
      {field.description && !hasError && (
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
            color: '#475569'
          }}>
          {field.description}
        </span>
      )}
    </div>
  );
}

// Small UI bits used by the headless form's authorize button (your code, not the SDK).
function OAuthSpinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ── Use case 2: file upload ─────────────────────────────────────────────────
// Stream files straight to a Nexla file_upload source URL — no connector, no credential.

// Styled: <NexlaFileUpload> is the drop-in dropzone (handles selection, progress, errors).
function FileUploadStyledSection({ theme, isDark }: { theme: Theme; isDark: boolean }) {
  return (
    <section style={sectionStyles(theme)}>
      <p style={labelStyle(theme)}>Pattern 1 — Styled</p>
      <h2 style={titleStyle(theme)}>Drop-in SDK component</h2>
      <p style={subtitleStyle(theme)}>
        Drop in <code style={codeStyle(theme)}>NexlaFileUpload</code> with the upload URL
        from a <code style={codeStyle(theme)}>file_upload</code> source you created in
        Nexla. It handles selection, per-file progress, and errors — and warns you here
        if the URL isn&apos;t configured.
      </p>
      <NexlaThemeProvider mode={isDark ? 'dark' : 'light'}>
        <NexlaFileUpload uploadUrl={FILE_UPLOAD_URL} />
      </NexlaThemeProvider>
    </section>
  );
}

// Headless: useFileUpload() drives selection/upload/progress; you render the dropzone + list.
function FileUploadHeadlessSection({ theme }: { theme: Theme }) {
  const {
    files,
    uploadState,
    configError,
    isUploading,
    validationErrors,
    dragHandlers,
    dropZoneRef,
    fileInputRef,
    openFilePicker,
    handleFileInputChange,
    removeFile,
    upload
  } = useFileUpload({ uploadUrl: FILE_UPLOAD_URL });

  const mono: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, monospace' };

  return (
    <section style={sectionStyles(theme)}>
      <p style={labelStyle(theme)}>Pattern 2 — Headless</p>
      <h2 style={titleStyle(theme)}>Bring your own UI</h2>
      <p style={subtitleStyle(theme)}>
        Use <code style={codeStyle(theme)}>useFileUpload</code> to drive selection, upload,
        and per-file progress with any markup you like.
      </p>

      {configError !== null ? (
        <div style={{ color: theme.errorText, fontSize: 13, ...mono }}>
          // {configError.message}
        </div>
      ) : (
        <div
          style={{
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: 16,
            background: theme.surface
          }}>
          <div
            ref={dropZoneRef}
            {...dragHandlers}
            onClick={openFilePicker}
            role="button"
            tabIndex={0}
            style={{
              border: `1px dashed ${theme.border}`,
              borderRadius: 8,
              padding: 20,
              textAlign: 'center',
              cursor: 'pointer',
              color: theme.textMuted,
              fontSize: 13,
              ...mono
            }}>
            // drop files or click to browse
            <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileInputChange} />
          </div>

          {files.map((f) => {
            const st = uploadState[f.id];
            const pct = st && (st.status === 'uploading' || st.status === 'uploaded') ? ` ${st.progress}%` : '';
            return (
              <div
                key={f.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 12, color: theme.textSecondary, ...mono }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </span>
                <span style={{ color: st?.status === 'error' ? theme.errorText : theme.textMuted }}>
                  {(st?.status ?? 'pending') + pct}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  aria-label={`Remove ${f.name}`}
                  style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer' }}>
                  ×
                </button>
              </div>
            );
          })}

          {validationErrors.map((e, i) => (
            <div key={i} style={{ color: theme.errorText, fontSize: 12, marginTop: 6, ...mono }}>
              // {e.message}
            </div>
          ))}

          {files.length > 0 && (
            <button
              type="button"
              onClick={() => { void upload(); }}
              disabled={isUploading}
              style={{
                marginTop: 14,
                padding: '8px 16px',
                ...mono,
                fontWeight: 600,
                background: isUploading ? '#1e2d3d' : theme.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}>
              {isUploading ? '// uploading…' : '// upload()'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// ============================================================================
//  Demo scaffolding — theme + page chrome. NONE of this is the SDK integration;
//  it just makes the playground look nice and is identical across all examples.
// ============================================================================

type Theme = ReturnType<typeof getNexlaTheme>;

function NexlaMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * (21.25 / 35.87)}
      viewBox="0 0 35.87 21.25"
      aria-hidden="true">
      <path
        fill="#6254ff"
        d="M2.86,15.85L.13,13.13c-.17-.17-.17-.45,0-.63L11.25,1.38c.89-.89,2.07-1.38,3.32-1.38s2.43.49,3.32,1.38l6.36,6.36c.17.17.17.45,0,.63l-2.73,2.73c-.17.17-.45.17-.63,0l-5.56-5.56c-.43-.43-1.12-.43-1.54,0L3.49,15.85c-.17.17-.45.17-.63,0Z"
      />
      <path
        fill="#6254ff"
        d="M21.21,21.25c-1.2,0-2.41-.46-3.32-1.37l-6.36-6.36c-.17-.17-.17-.45,0-.63l2.73-2.73c.17-.17.45-.17.63,0l5.56,5.56c.43.43,1.12.43,1.54,0l10.4-10.4c.17-.17.45-.17.63,0l2.73,2.73c.17.17.17.45,0,.63l-11.21,11.21c-.92.92-2.12,1.37-3.32,1.37Z"
      />
    </svg>
  );
}

function StickyHeader({
  theme,
  onToggle
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: 56,
        background: theme.dark
          ? 'rgba(15, 17, 23, 0.85)'
          : 'rgba(241, 245, 249, 0.85)',
        borderBottom: `1px solid ${theme.border}`
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NexlaMark size={26} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: theme.textPrimary,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
          Nexla React SDK
        </span>
      </div>

      <button
        onClick={onToggle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 14px',
          borderRadius: 20,
          border: `1px solid ${theme.btnBorder}`,
          background: theme.btnBg,
          color: theme.textSecondary,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          transition: 'color 0.15s, background 0.15s',
          outline: 'none'
        }}
        aria-label="Toggle theme">
        {theme.dark ? (
          <>
            <SunIcon />
            Light
          </>
        ) : (
          <>
            <MoonIcon />
            Dark
          </>
        )}
      </button>
    </header>
  );
}

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function sectionStyles(theme: Theme, last = false): React.CSSProperties {
  return {
    padding: '40px',
    borderBottom: last ? 'none' : `1px solid ${theme.border}`
  };
}

function labelStyle(theme: Theme): React.CSSProperties {
  return {
    margin: '0 0 6px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: theme.accent,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };
}

function titleStyle(theme: Theme): React.CSSProperties {
  return {
    margin: '0 0 8px',
    fontSize: 22,
    fontWeight: 700,
    color: theme.textPrimary,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };
}

function subtitleStyle(theme: Theme): React.CSSProperties {
  return {
    margin: '0 0 24px',
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.textSecondary,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };
}

function codeStyle(theme: Theme): React.CSSProperties {
  return {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
    color: theme.codeFg
  };
}

function PartHeading({
  theme,
  part,
  title,
  blurb
}: {
  theme: Theme;
  part: string;
  title: string;
  blurb: string;
}) {
  return (
    <div style={{ padding: '48px 40px 8px' }}>
      <p style={{ ...labelStyle(theme), fontSize: 12 }}>{part}</p>
      <h1 style={{ ...titleStyle(theme), fontSize: 30, fontWeight: 800, margin: '4px 0 10px' }}>
        {title}
      </h1>
      <p style={{ ...subtitleStyle(theme), fontSize: 15, margin: 0, maxWidth: 760 }}>{blurb}</p>
    </div>
  );
}

function Footer({ theme }: { theme: Theme }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${theme.border}`,
        padding: '28px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NexlaMark size={22} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: theme.textPrimary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.01em'
          }}>
          Nexla React SDK
        </span>
        <span
          style={{
            fontSize: 12,
            color: theme.textMuted,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
          — Built for seamless third-party integrations
        </span>
      </div>
      <span
        style={{
          fontSize: 12,
          color: theme.textMuted,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
        nexla.com
      </span>
    </footer>
  );
}
