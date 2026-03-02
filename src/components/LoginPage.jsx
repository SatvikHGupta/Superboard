// jo dekha wahi sikandar

import { useState } from 'react';
import { signInWithGoogle } from '../firebase/auth.js';

/* Logo mark — stylised canvas with pen nib*/
function LogoMark() {
  return (
    <div style={{ display: 'inline-flex', marginBottom: 16 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <rect width="52" height="52" rx="14" fill="rgba(99,102,241,0.1)" />
        <rect width="52" height="52" rx="14" stroke="rgba(129,140,248,0.2)" strokeWidth="1" />
        <line x1="13" y1="18" x2="34" y2="18" stroke="#818cf8" strokeWidth="2"  strokeLinecap="round" />
        <line x1="13" y1="24" x2="28" y2="24" stroke="#818cf8" strokeWidth="2"  strokeLinecap="round" opacity="0.65" />
        <line x1="13" y1="30" x2="31" y2="30" stroke="#818cf8" strokeWidth="2"  strokeLinecap="round" opacity="0.4"  />
        <circle cx="38" cy="37" r="7" fill="rgba(99,102,241,0.18)" />
        <path d="M35.5 37 L38 34.5 L40.5 37 L38 39.5 Z" fill="#a78bfa" />
        <circle cx="38" cy="37" r="1.4" fill="#fff" fillOpacity="0.9" />
      </svg>
    </div>
  );
}

/* Google full-colour logo */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/* Feature tiles*/
const FEATURES = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
    ),
    title: 'Pen, Shapes & Text',
    desc:  'Many tools for any ideas',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    title: 'See your team live',
    desc:  'Cursors update in real time',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    title: 'Direct Export',
    desc:  'High-res export in png/pdf',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5"  r="3"/>
        <circle cx="6"  cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
      </svg>
    ),
    title: 'Share your way',
    desc:  'Public link or private invite',
  },
];

/* Component */
export default function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      localStorage.setItem('wb_user', JSON.stringify({
        uid:         user.uid,
        email:       user.email,
        displayName: user.displayName,
      }));
      onLogin(user);
    } catch (error) {
      alert('Sign-in failed: ' + error.message);
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      {/* Subtle deep centre glow */}
      <div className="login-orb" style={{
        width: 280, height: 280,
        background: '#6366f1',
        top: '55%', left: '45%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.05,
      }} />

      <div className="glass-card login-card">

        <LogoMark />
        <div className="login-logo">Superboard</div>

        {/* Live status badge */}
        <div style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          6,
          padding:      '4px 12px',
          borderRadius: 'var(--r-full)',
          background:   'rgba(99,102,241,0.1)',
          border:       '1px solid rgba(99,102,241,0.22)',
          fontSize:     11,
          fontWeight:   600,
          color:        'var(--a-light)',
          marginBottom: 14,
          letterSpacing: '0.02em',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#22c55e',
            display:    'inline-block',
            boxShadow:  '0 0 5px #22c55e88',
          }} />
          Live collaboration
        </div>

        {/* Tagline */}
        <p className="login-subtitle" style={{
          fontSize:     15,
          color:        'var(--tx-2)',
          marginBottom: 15,
          lineHeight:   1.65,
        }}>
          Just a better whiteboard
        </p>

        {/* Feature chips */}
        <div className="login-features" style={{ marginBottom: 28 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="login-feature">
              <div className="login-feature-icon">{f.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div className="login-feature-text" style={{
                  fontWeight:   600,
                  lineHeight:   1.3,
                  marginBottom: 2,
                }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--tx-4)', lineHeight: 1.3 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/*  Divider */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          10,
          marginBottom: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--br-2)' }} />
          <span style={{
            fontSize:      10,
            fontWeight:    600,
            color:         'var(--tx-4)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Sign in to continue
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--br-2)' }} />
        </div>

        {/*Google sign-in button */}
        <button
          className="login-btn-google"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Signing you in…
            </>
          ) : (
            <>
              <GoogleLogo />
              Continue with Google
            </>
          )}
        </button>

        {/*Trust text*/}
        <p style={{
          fontSize:   11,
          color:      'var(--tx-4)',
          marginTop:  -8,
          lineHeight: 1.7,
        }}>
          Made with love by SHG
        </p>

      </div>
    </div>
  );
}