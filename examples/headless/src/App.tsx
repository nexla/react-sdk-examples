/**
 * Headless example — bring your own UI (no SDK-rendered controls).
 *
 * WHY LOOK AT THIS: you want to render the credential form yourself. useConnectorForm loads the
 * fields, applies conditional visibility/defaults, validates, runs OAuth, and submits — you own
 * every element. This example renders the form with plain HTML controls.
 *
 * Two parts below:
 *   1) SDK USAGE        — what you'd copy into your app (useConnectorForm + your own inputs).
 *   2) Demo scaffolding — theme + page chrome so the example looks nice. Identical across all the
 *                         examples and the playground; you can ignore it.
 */

import React, { useState } from 'react';
import {
  NexlaConnectProvider,
  useNexlaConnect,
  useConnectorForm,
  getNexlaTheme
} from '@nexla/react-sdk';
import type { ConnectorSpecAuthField } from '@nexla/react-sdk';

// ============================================================================
//  SDK USAGE — the part you copy into your app
// ============================================================================

// Developer config — from .env.local (see .env.example).
const API_BASE_URL =
  (import.meta.env['VITE_NEXLA_API_BASE_URL'] as string | undefined) ??
  'https://dataops.nexla.io/nexla-api';
const ENABLED_CONNECTORS = ['gdrive', 'notion_api', 'sf_api', 'hub_api', 's3', 'asana_api', 'box'];
const SERVICE_KEY = (import.meta.env['VITE_NEXLA_SERVICE_KEY'] as string | undefined) ?? '';
const APPLICATION_ID =
  (import.meta.env['VITE_NEXLA_APPLICATION_ID'] as string | undefined) ??
  'missing-VITE_NEXLA_APPLICATION_ID';
const END_USER_ID =
  (import.meta.env['VITE_NEXLA_END_USER_ID'] as string | undefined) ?? 'demo-user';

export function App() {
  const [isDark, setIsDark] = useState(true);
  const theme = getNexlaTheme(isDark ? 'dark' : 'light');

  return (
    <NexlaConnectProvider
      apiBaseUrl={API_BASE_URL}
      serviceKey={SERVICE_KEY}
      connectors={ENABLED_CONNECTORS}
      applicationId={APPLICATION_ID}
      endUserId={END_USER_ID}>
      <div
        style={{
          minHeight: '100vh',
          background: theme.bg,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          transition: 'background 0.2s'
        }}>
        <StickyHeader theme={theme} onToggle={() => setIsDark((d) => !d)} />
        <main style={{ maxWidth: 900, margin: '0 auto' }}>
          <HeadlessSection theme={theme} />
        </main>
        <Footer theme={theme} />
      </div>
    </NexlaConnectProvider>
  );
}

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

// ============================================================================
//  Demo scaffolding — theme + page chrome (NOT part of the SDK integration).
//  Identical across all examples + the playground; safe to ignore.
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
