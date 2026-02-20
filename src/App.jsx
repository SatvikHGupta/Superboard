import { useState, useEffect, useCallback } from 'react';
import LoginPage   from './components/LoginPage.jsx';
import Dashboard   from './components/dashboard/Dashboard.jsx';
import Whiteboard  from './components/whiteboard/Whiteboard.jsx';
import ViewerPage  from './components/ViewerPage.jsx';
import AdminPage   from './components/admin/AdminPage.jsx';
import { auth }    from './firebase/config.js';
import { onAuthStateChanged } from 'firebase/auth';

const ROUTES = {
  LOGIN:     'login',
  DASHBOARD: 'dashboard',
  BOARD:     'board',
  VIEWER:    'viewer',
  ADMIN:     'admin',
};

export function App() {
  const [user,        setUser]        = useState(null);
  const [page,        setPage]        = useState(ROUTES.DASHBOARD);
  const [boardId,     setBoardId]     = useState(null);

  // ─── AUTH LOADING GATE ────────────────────────────────────────────────
  // Stays true until onAuthStateChanged fires for the first time.
  // This guarantees the Firebase SDK is fully initialized — auth tokens are
  // attached to requests, and Firestore security rules evaluate correctly.
  //
  // Without this gate:
  //  • First load: ViewerPage and Whiteboard mount BEFORE auth resolves.
  //    Firestore reads go out unauthenticated → rules deny → board not found
  //    or continuous loading spinner.
  //  • After refresh: SDK reads cached auth from IndexedDB, resolves faster,
  //    so it "works" — explaining the refresh-fixes-it symptom.
  //
  // With this gate: every route waits for that first callback. For logged-in
  // users this is ~50–150 ms. For logged-out users it's the same — and they
  // either see the viewer (public route) or get redirected to login.
  const [authLoading, setAuthLoading] = useState(true);

  /* ── Firebase Auth listener ──────────────────────────────────────────── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        const u = {
          uid:         firebaseUser.uid,
          email:       firebaseUser.email,
          displayName: firebaseUser.displayName,
        };
        localStorage.setItem('wb_user', JSON.stringify(u));
        setUser(u);
      } else {
        localStorage.removeItem('wb_user');
        setUser(null);
      }
      // ← First callback has fired: Firebase SDK is ready.
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

  /* ── Navigation handlers ─────────────────────────────────────────────── */
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

  /* ── Auth loading spinner — shown for ALL routes ─────────────────────── */
  // Keeps the spinner consistent and prevents any Firestore read from firing
  // before the SDK is ready. Typically resolves in under 200 ms.
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

  /* ── Route rendering (auth always resolved below this line) ─────────── */

  // Public viewer — rendered for logged-in AND logged-out users
  if (page === ROUTES.VIEWER && boardId) {
    return <ViewerPage boardId={boardId} />;
  }

  // Protected routes — redirect to login if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (page === ROUTES.ADMIN) {
    return <AdminPage user={user} onBack={handleBack} />;
  }

  if (page === ROUTES.BOARD && boardId) {
    return <Whiteboard boardId={boardId} onBack={handleBack} user={user} />;
  }

  return (
    <Dashboard
      user={user}
      onOpenBoard={handleOpenBoard}
      onLogout={handleLogout}
    />
  );
}