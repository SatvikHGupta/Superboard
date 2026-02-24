// src/App.jsx
// v1.4.2: Ban check — after auth resolves, calls isBanned(uid).
//   If the user is in /banned_users, they see an "Account Suspended" screen
//   regardless of which route they try to access. Auth state is valid but
//   all protected routes are blocked. They cannot navigate around the ban.

import { useState, useEffect, useCallback } from 'react';
import LoginPage   from './components/LoginPage.jsx';
import Dashboard   from './components/dashboard/Dashboard.jsx';
import Whiteboard  from './components/whiteboard/Whiteboard.jsx';
import ViewerPage  from './components/ViewerPage.jsx';
import AdminPage   from './components/admin/AdminPage.jsx';
import { auth }    from './firebase/config.js';
import { isBanned } from './firebase/banService.js';
import { trackUserLogin } from './firebase/userService.js';
import QuotaWarningBanner from './components/QuotaWarningBanner.jsx';
import { onAuthStateChanged } from 'firebase/auth';

const ROUTES = {
  LOGIN:     'login',
  DASHBOARD: 'dashboard',
  BOARD:     'board',
  VIEWER:    'viewer',
  ADMIN:     'admin',
};

// ── Suspended screen ───────────────────────────────────────────────────────
function SuspendedPage({ ban, onLogout }) {
  return (
    <div className="error-page">
      <div className="glass-card error-card" style={{ maxWidth: 420, textAlign: 'center' }}>
        <div className="error-icon" style={{ background: 'rgba(239,68,68,0.1)', fontSize: 40 }}>🚫</div>
        <div className="error-title" style={{ color: 'var(--red)' }}>Account Suspended</div>
        <div className="error-text" style={{ marginTop: 12, lineHeight: 1.7 }}>
          Your account has been suspended and you cannot access Superboard.
        </div>
        {ban?.reason && (
          <div style={{
            margin: '16px 0', padding: '10px 16px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--r-md)',
            fontSize: 13, color: 'var(--tx-3)', fontStyle: 'italic',
          }}>
            Reason: {ban.reason}
          </div>
        )}
        <div style={{ fontSize: 13, color: 'var(--tx-4)', marginBottom: 20 }}>
          If you believe this is a mistake, please contact the platform administrator.
        </div>
        <button className="btn btn-ghost" onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
}

export function App() {
  const [user,        setUser]        = useState(null);
  const [page,        setPage]        = useState(ROUTES.DASHBOARD);
  const [boardId,     setBoardId]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // banInfo: null = not banned, object = ban record with reason/bannedAt
  const [banInfo,     setBanInfo]     = useState(null);

  /* ── Firebase Auth listener ──────────────────────────────────────────── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        // Check ban status every time auth resolves (login, page reload).
        // Costs 1 Firestore read per session — negligible.
        const ban = await isBanned(firebaseUser.uid);
        if (ban) {
          // Banned: don't store user in state (prevents navigating anywhere),
          // just store the ban record so we can show the reason.
          setBanInfo(ban);
          setUser(null);
        } else {
          setBanInfo(null);
          const u = {
            uid:         firebaseUser.uid,
            email:       firebaseUser.email,
            displayName: firebaseUser.displayName,
          };
          localStorage.setItem('wb_user', JSON.stringify(u));
          // Track this login in /users collection (admin panel user count)
          trackUserLogin(u).catch(() => {});
          setUser(u);
        }
      } else {
        localStorage.removeItem('wb_user');
        setUser(null);
        setBanInfo(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  /* ── Hash-based routing ──────────────────────────────────────────────── */
  const parseHash = useCallback(() => {
    const hash = window.location.hash || '';

    if (hash.startsWith('#/view/')) {
      const id = hash.replace('#/view/', '');
      if (id) { setBoardId(id); setPage(ROUTES.VIEWER); return; }
    }
    if (hash.startsWith('#/board/')) {
      const id = hash.replace('#/board/', '');
      if (id) { setBoardId(id); setPage(ROUTES.BOARD); return; }
    }
    if (hash === '#/admin') { setBoardId(null); setPage(ROUTES.ADMIN); return; }

    setBoardId(null);
    setPage(ROUTES.DASHBOARD);
  }, []);

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, [parseHash]);

  /* ── Auth handlers ───────────────────────────────────────────────────── */
  function handleLogin(u) {
    setUser(u);
    setPage(ROUTES.DASHBOARD);
    window.location.hash = '#/';
  }

  function handleLogout() { auth.signOut(); }

  function handleOpenBoard(id) {
    setBoardId(id);
    setPage(ROUTES.BOARD);
    window.location.hash = '#/board/' + id;
  }

  function handleBack() {
    setPage(ROUTES.DASHBOARD);
    setBoardId(null);
    window.location.hash = '#/';
  }

  /* ── Auth loading spinner ────────────────────────────────────────────── */
  if (authLoading) {
    return (
      <div className="error-page">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="var(--a)" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <span style={{ color: 'var(--tx-3)', fontSize: 14 }}>Loading…</span>
        </div>
      </div>
    );
  }

  /* ── Banned user screen — shown before any route rendering ──────────── */
  // banInfo is set even when user is not in state, so banned users
  // always see the suspension screen and cannot access anything.
  if (banInfo) {
    return <SuspendedPage ban={banInfo} onLogout={handleLogout} />;
  }

  /* ── Public viewer — accessible without login ────────────────────────── */
  if (page === ROUTES.VIEWER && boardId) {
    return <ViewerPage boardId={boardId} />;
  }

  /* ── Protected routes ────────────────────────────────────────────────── */
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (page === ROUTES.ADMIN) {
    return (<><AdminPage user={user} onBack={handleBack} /><QuotaWarningBanner /></>);
  }

  if (page === ROUTES.BOARD && boardId) {
    return (<><Whiteboard boardId={boardId} onBack={handleBack} user={user} /><QuotaWarningBanner /></>);
  }

  return (
    <>
      <Dashboard
        user={user}
        onOpenBoard={handleOpenBoard}
        onLogout={handleLogout}
      />
      <QuotaWarningBanner />
    </>
  );
}