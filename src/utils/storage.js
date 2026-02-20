// src/utils/storage.js
//
// Legacy localStorage helpers.
//
// WHAT REMAINS:
//   getCurrentUser()  — read the cached user object written by App.jsx's
//                       onAuthStateChanged handler.
//   getBoardShareLink() — pure URL builder, no Firestore dependency.
//
// WHAT WAS REMOVED (all now in firebase/boardService.js or utils/thumbnail.js):
//   createBoard / deleteBoard / updateBoard / getBoardById
//   getElements / saveElements / getBoards / saveBoards
//   addEditor / removeEditor / canUserEdit / toggleBoardVisibility
//   updateBoardSharing / setBoardVisibility
//   generateThumbnail → utils/thumbnail.js

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