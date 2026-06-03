/**
 * Styled example — drop-in connector UI (the fastest path).
 *
 * WHY LOOK AT THIS: you want users connecting accounts with the least code. The SDK renders the
 * connector grid, the credential modal, OAuth, and toasts — your integration is essentially
 * <NexlaConnectProvider> + <NexlaConnectorCard>/<NexlaConnectButton> + <NexlaConnectModal>,
 * wrapped in <NexlaThemeProvider>. Roughly a dozen lines of real wiring.
 *
 * Two parts below:
 *   1) SDK USAGE        — what you'd copy into your app.
 *   2) Demo scaffolding — theme + page chrome so the example looks nice. Identical across all the
 *                         examples and the playground; you can ignore it.
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
  useNexlaSnackbar,
  getNexlaTheme
} from '@nexla/react-sdk';
import type { UseNexlaSnackbarResult } from '@nexla/react-sdk';

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
  const snackbar = useNexlaSnackbar();

  return (
    <NexlaConnectProvider
      apiBaseUrl={API_BASE_URL}
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
        <main style={{ maxWidth: 900, margin: '0 auto' }}>
          <StyledSection theme={theme} onProbeError={snackbar.onProbeError} />
        </main>
        <Footer theme={theme} />
      </div>
      <NexlaThemeProvider mode={isDark ? 'dark' : 'light'}>
        <NexlaSnackbar {...snackbar.snackbarProps} />
      </NexlaThemeProvider>
    </NexlaConnectProvider>
  );
}

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
          Nexla Connect SDK
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
          Nexla Connect SDK
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
