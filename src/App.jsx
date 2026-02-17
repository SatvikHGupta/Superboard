import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from './utils/storage.js';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Whiteboard from './components/whiteboard/Whiteboard.jsx';
import ViewerPage from './components/ViewerPage.jsx';
import { auth } from './firebase/config.js';
import { onAuthStateChanged } from 'firebase/auth';

/* ──────────────────────────────────────────────
   Route Constants
   ────────────────────────────────────────────── */
var ROUTES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  BOARD: 'board',
  VIEWER: 'viewer',
};

/* ──────────────────────────────────────────────
   App — Root Component with Protected Routes
   ────────────────────────────────────────────── */
export function App() {
  var [user, setUser] = useState(null);
  var [page, setPage] = useState(ROUTES.DASHBOARD);
  var [boardId, setBoardId] = useState(null);

  /* ── Firebase Auth Listener (REAL session source) ───── */
  useEffect(function () {
    var unsubscribe = onAuthStateChanged(auth, function (firebaseUser) {
      if (firebaseUser) {
        var u = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        };
        localStorage.setItem('wb_user', JSON.stringify(u));
        setUser(u);
      } else {
        localStorage.removeItem('wb_user');
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  /* ── Hash-based routing ──────────────────── */
  var parseHash = useCallback(function () {
    var hash = window.location.hash || '';

    if (hash.startsWith('#/view/')) {
      var id = hash.replace('#/view/', '');
      if (id) {
        setBoardId(id);
        setPage(ROUTES.VIEWER);
        return;
      }
    }

    if (hash.startsWith('#/board/')) {
      var bId = hash.replace('#/board/', '');
      if (bId) {
        setBoardId(bId);
        setPage(ROUTES.BOARD);
        return;
      }
    }

    setBoardId(null);
    setPage(ROUTES.DASHBOARD);
  }, []);

  useEffect(function () {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return function () { window.removeEventListener('hashchange', parseHash); };
  }, [parseHash]);

  /* ── Auth handlers ───────────────────────── */
  function handleLogin(u) {
    setUser(u);
    setPage(ROUTES.DASHBOARD);
    window.location.hash = '#/';
  }

  function handleLogout() {
    auth.signOut();
  }

  /* ── Navigation handlers ─────────────────── */
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

  /* ────────────────────────────────────────────
     ROUTE RENDERING
     ──────────────────────────────────────────── */

  if (page === ROUTES.VIEWER && boardId) {
    return <ViewerPage boardId={boardId} />;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (page === ROUTES.BOARD && boardId) {
    return <Whiteboard boardId={boardId} onBack={handleBack} />;
  }

  return (
    <Dashboard
      user={user}
      onOpenBoard={handleOpenBoard}
      onLogout={handleLogout}
    />
  );
}
