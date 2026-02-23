import { useCallback } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db }                          from '../firebase/config.js';
import { softDeleteBoard }             from '../firebase/boardService.js';
import { banUser, unbanUser }          from '../firebase/banService.js';
import { writeAuditLog }               from '../firebase/auditService.js';

export function useAdminActions({ boards, setBoards, setStats, setBannedUsers, askConfirm, closeConfirm, adminEmail }) {

  const handleDeleteBoard = useCallback((boardId) => {
    const board = boards.find(b => b.id === boardId);
    askConfirm({
      title: 'Move to Recycle Bin',
      message: `Move "${board?.name || boardId}" to the recycle bin? It can be restored within 30 days.`,
      confirmLabel: 'Move to Bin', danger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await softDeleteBoard(boardId, adminEmail);
          await writeAuditLog('BOARD_SOFT_DELETED', { actorEmail: adminEmail, boardId, boardName: board?.name });
          setBoards(prev => prev.filter(b => b.id !== boardId));
          setStats(prev => ({
            ...prev,
            totalBoards:   prev.totalBoards - 1,
            publicBoards:  prev.publicBoards  - (board?.visibility === 'public'  ? 1 : 0),
            privateBoards: prev.privateBoards - (board?.visibility === 'private' ? 1 : 0),
          }));
        } catch (err) { console.error('Soft delete failed:', err); alert('Failed to move board to bin.'); }
      },
    });
  }, [boards, askConfirm, closeConfirm, adminEmail, setBoards, setStats]);

  const handleToggleVisibility = useCallback((boardId, currentVis) => {
    const newVis = currentVis === 'public' ? 'private' : 'public';
    const board  = boards.find(b => b.id === boardId);
    askConfirm({
      title: `Make Board ${newVis === 'public' ? 'Public' : 'Private'}`,
      message: `Change "${board?.name || boardId}" to ${newVis}?`,
      confirmLabel: `Make ${newVis}`, danger: false,
      onConfirm: async () => {
        closeConfirm();
        try {
          await updateDoc(doc(db, 'boards', boardId), { visibility: newVis });
          await writeAuditLog('VISIBILITY_CHANGED', { actorEmail: adminEmail, boardId, boardName: board?.name, detail: `→ ${newVis}` });
          setBoards(prev => prev.map(b => b.id === boardId ? { ...b, visibility: newVis } : b));
        } catch { alert('Failed to update visibility'); }
      },
    });
  }, [boards, askConfirm, closeConfirm, adminEmail, setBoards]);

  const handleBulkDelete = useCallback((ids, onDone) => {
    askConfirm({
      title: `Move ${ids.length} Boards to Bin`,
      message: `Move ${ids.length} boards to the recycle bin?`,
      confirmLabel: `Move ${ids.length} to Bin`, danger: true, typeToConfirm: 'DELETE',
      onConfirm: async () => {
        closeConfirm();
        try {
          for (const id of ids) {
            await softDeleteBoard(id, adminEmail);
            const board = boards.find(b => b.id === id);
            await writeAuditLog('BOARD_SOFT_DELETED', { actorEmail: adminEmail, boardId: id, boardName: board?.name });
          }
          setBoards(prev => prev.filter(b => !ids.includes(b.id)));
          setStats(prev => ({ ...prev, totalBoards: prev.totalBoards - ids.length }));
          onDone?.();
        } catch (err) { console.error('Bulk delete failed:', err); alert('Failed to delete some boards.'); }
      },
    });
  }, [boards, askConfirm, closeConfirm, adminEmail, setBoards, setStats]);

  const handleBulkToggleVisibility = useCallback((ids, newVis, onDone) => {
    askConfirm({
      title: `Make ${ids.length} Boards ${newVis}`,
      message: `Change ${ids.length} selected boards to ${newVis}?`,
      confirmLabel: `Make ${newVis}`, danger: false,
      onConfirm: async () => {
        closeConfirm();
        try {
          const batch = writeBatch(db);
          ids.forEach(id => batch.update(doc(db, 'boards', id), { visibility: newVis }));
          await batch.commit();
          await writeAuditLog('VISIBILITY_CHANGED', { actorEmail: adminEmail, detail: `Bulk ${ids.length} boards → ${newVis}` });
          setBoards(prev => prev.map(b => ids.includes(b.id) ? { ...b, visibility: newVis } : b));
          onDone?.();
        } catch { alert('Failed to update boards'); }
      },
    });
  }, [askConfirm, closeConfirm, adminEmail, setBoards]);

  const handleDeleteAllBoards = useCallback(() => {
    askConfirm({
      title: '⚠️ Move ALL Boards to Bin',
      message: `Move ALL ${boards.length} boards to the recycle bin?`,
      confirmLabel: `Move All ${boards.length} Boards`, danger: true, typeToConfirm: 'DELETE ALL',
      onConfirm: async () => {
        closeConfirm();
        for (const board of boards) await softDeleteBoard(board.id, adminEmail).catch(() => {});
        setBoards([]);
        setStats(prev => ({ ...prev, totalBoards: 0, publicBoards: 0, privateBoards: 0 }));
      },
    });
  }, [boards, askConfirm, closeConfirm, adminEmail, setBoards, setStats]);

  const handleBanUser = useCallback(async (targetUser, reason) => {
    try {
      await banUser(targetUser.uid, targetUser.email, reason, adminEmail);
      await writeAuditLog('USER_BANNED', { actorEmail: adminEmail, targetId: targetUser.uid, targetEmail: targetUser.email, detail: reason || 'No reason given' });
      setBannedUsers(prev => [...prev, { id: targetUser.uid, uid: targetUser.uid, email: targetUser.email, reason }]);
    } catch (err) { alert('Ban failed: ' + err.message); }
  }, [adminEmail, setBannedUsers]);

  const handleUnbanUser = useCallback((targetUser) => {
    askConfirm({
      title: 'Unban User', message: `Restore access for ${targetUser.email}?`,
      confirmLabel: 'Unban', danger: false,
      onConfirm: async () => {
        closeConfirm();
        try {
          await unbanUser(targetUser.uid);
          await writeAuditLog('USER_UNBANNED', { actorEmail: adminEmail, targetEmail: targetUser.email });
          setBannedUsers(prev => prev.filter(b => b.uid !== targetUser.uid));
        } catch (err) { alert('Unban failed: ' + err.message); }
      },
    });
  }, [askConfirm, closeConfirm, adminEmail, setBannedUsers]);

  return {
    handleDeleteBoard, handleToggleVisibility,
    handleBulkDelete, handleBulkToggleVisibility, handleDeleteAllBoards,
    handleBanUser, handleUnbanUser,
  };
}