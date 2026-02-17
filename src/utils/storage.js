const BOARDS_KEY = "wb_boards";
const ELEMENTS_PREFIX = "wb_els_";

export function getCurrentUser() {
  try {
    const data = localStorage.getItem("wb_user");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function getBoards() {
  try {
    const data = localStorage.getItem(BOARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveBoards(boards) {
  localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
}

export function createBoard(userId, userEmail, name) {
  const boards = getBoards();
  const board = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
    name,
    ownerId: userId || 'local',
    ownerEmail: userEmail || 'user@demo.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thumbnail: null,
    boardWidth: 1200,
    boardHeight: 1600,
    visibility: "private",
    editors: [],
  };
  boards.unshift(board);
  saveBoards(boards);
  return board;
}

export function deleteBoard(id) {
  const boards = getBoards().filter((b) => b.id !== id);
  saveBoards(boards);
  localStorage.removeItem(ELEMENTS_PREFIX + id);
}

export function updateBoard(id, updates) {
  const boards = getBoards();
  const idx = boards.findIndex((b) => b.id === id);
  if (idx !== -1) {
    boards[idx] = {
      ...boards[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveBoards(boards);
  }
}

export function getBoardById(id) {
  return getBoards().find((b) => b.id === id) || null;
}

export function getElements(boardId) {
  try {
    const data = localStorage.getItem(ELEMENTS_PREFIX + boardId);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveElements(boardId, elements) {
  localStorage.setItem(ELEMENTS_PREFIX + boardId, JSON.stringify(elements));
}

export function generateThumbnail(canvasEl) {
  if (!canvasEl) return null;
  try {
    const dpr = window.devicePixelRatio || 1;
    /* Get the CSS pixel dimensions of the source canvas */
    const srcCSSWidth = canvasEl.width / dpr;
    const srcCSSHeight = canvasEl.height / dpr;

    /* Thumbnail size */
    const thumbW = 400;
    const thumbH = 225;

    /* Calculate how much of the source to grab (top portion) */
    const scale = thumbW / srcCSSWidth;
    const srcCropHeight = Math.min(srcCSSHeight, thumbH / scale);

    /* Source coordinates in actual canvas pixels (accounting for DPR) */
    const sx = 0;
    const sy = 0;
    const sw = canvasEl.width;
    const sh = srcCropHeight * dpr;

    const thumb = document.createElement("canvas");
    thumb.width = thumbW;
    thumb.height = thumbH;
    const ctx = thumb.getContext("2d");

    /* White background */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, thumbW, thumbH);

    /* Draw the top portion of the main canvas scaled to fit */
    const dh = srcCropHeight * scale;
    ctx.drawImage(canvasEl, sx, sy, sw, sh, 0, 0, thumbW, dh);

    return thumb.toDataURL("image/jpeg", 0.7);
  } catch {
    return null;
  }
}

/* ─── Sharing helpers ─── */

export function toggleBoardVisibility(boardId) {
  const board = getBoardById(boardId);
  if (!board) return;
  const newVis = board.visibility === 'public' ? 'private' : 'public';
  updateBoard(boardId, { visibility: newVis });
}

export function updateBoardSharing(boardId, updates) {
  updateBoard(boardId, updates);
}

export function setBoardVisibility(boardId, visibility) {
  updateBoard(boardId, { visibility });
}

export function addEditor(boardId, email) {
  const board = getBoardById(boardId);
  if (!board) return false;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return false;
  if (board.editors && board.editors.includes(trimmed)) return false;
  const editors = [...(board.editors || []), trimmed];
  updateBoard(boardId, { editors });
  return true;
}

export function removeEditor(boardId, email) {
  const board = getBoardById(boardId);
  if (!board) return;
  const editors = (board.editors || []).filter(
    (e) => e.toLowerCase() !== email.toLowerCase()
  );
  updateBoard(boardId, { editors });
}

export function canUserEdit(boardId, userEmail) {
  const board = getBoardById(boardId);
  if (!board) return false;
  if (!userEmail) return false;
  const email = userEmail.toLowerCase();
  if ((board.ownerEmail || "").toLowerCase() === email) return true;
  if ((board.editors || []).some((e) => e.toLowerCase() === email)) return true;
  return false;
}

export function getBoardShareLink(boardId) {
  const base = window.location.origin + window.location.pathname;
  return base + "#/view/" + boardId;
}
