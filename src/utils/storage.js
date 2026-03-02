// Local storage waala chotu

export function getCurrentUser() {
  try {
    const data = localStorage.getItem('wb_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function getBoardShareLink(boardId) {
  const base = window.location.origin + window.location.pathname;
  return base + '#/view/' + boardId;
}