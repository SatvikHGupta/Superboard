// src/firebase/auditService.js
//
// Writes to /admin/logs/{auto-id} whenever key platform events happen.
// Admin panel reads these to show: audit trail, per-user Firebase usage.
//
// Cost: 1 write per action (not per element). Total ~10–50 writes/day for
// a small team. Negligible on the free tier.

import {
  collection, addDoc, getDocs, query,
  orderBy, limit, serverTimestamp, deleteDoc, doc,
} from 'firebase/firestore';
import { db } from './config.js';

const LOGS_REF = () => collection(db, 'admin', 'data', 'logs');

/**
 * Action types — used for filtering and cost attribution in analytics.
 * cost_type: 'write' | 'read' | 'realtime'
 */
export const AUDIT_ACTIONS = {
  BOARD_CREATED:       { label: 'Board Created',        cost: 'write'    },
  BOARD_DELETED:       { label: 'Board Deleted',        cost: 'write'    },
  BOARD_SOFT_DELETED:  { label: 'Board Soft Deleted',   cost: 'write'    },
  BOARD_RESTORED:      { label: 'Board Restored',       cost: 'write'    },
  BOARD_PURGED:        { label: 'Board Permanently Deleted', cost: 'write'},
  VISIBILITY_CHANGED:  { label: 'Visibility Changed',   cost: 'write'    },
  EDITOR_ADDED:        { label: 'Editor Added',         cost: 'write'    },
  EDITOR_REMOVED:      { label: 'Editor Removed',       cost: 'write'    },
  ELEMENTS_SAVED:      { label: 'Elements Saved',       cost: 'write'    },
  USER_BANNED:         { label: 'User Banned',          cost: 'write'    },
  USER_UNBANNED:       { label: 'User Unbanned',        cost: 'write'    },
  BOARD_OPENED:        { label: 'Board Opened',         cost: 'read'     },
  ADMIN_DATA_LOADED:   { label: 'Admin Data Loaded',    cost: 'read'     },
};

/**
 * Write a single audit log entry.
 * @param {keyof typeof AUDIT_ACTIONS} action
 * @param {{
 *   actorId?: string, actorEmail?: string,
 *   boardId?: string, boardName?: string,
 *   targetId?: string, targetEmail?: string,
 *   detail?: string,
 * }} data
 */
export async function writeAuditLog(action, data = {}) {
  try {
    const meta = AUDIT_ACTIONS[action] || { label: action, cost: 'write' };
    await addDoc(LOGS_REF(), {
      action,
      label:       meta.label,
      cost:        meta.cost,
      actorId:     data.actorId     || null,
      actorEmail:  data.actorEmail  || null,
      boardId:     data.boardId     || null,
      boardName:   data.boardName   || null,
      targetId:    data.targetId    || null,
      targetEmail: data.targetEmail || null,
      detail:      data.detail      || null,
      ts:          serverTimestamp(),
    });
  } catch (err) {
    // Audit log failures must never break the main flow
    console.warn('Audit log write failed (non-fatal):', err);
  }
}

/**
 * Get the most recent audit log entries.
 * @param {number} count
 * @returns {Promise<object[]>}
 */
export async function getAuditLogs(count = 200) {
  try {
    const q    = query(LOGS_REF(), orderBy('ts', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Failed to load audit logs:', err);
    return [];
  }
}

/**
 * Delete all audit log entries older than `days` days.
 * Called from admin panel "Prune Logs" button.
 */
export async function pruneAuditLogs(days = 30) {
  const cutoff = Date.now() - days * 86400000;
  const q      = query(LOGS_REF(), orderBy('ts', 'asc'), limit(500));
  const snap   = await getDocs(q);
  const toDelete = snap.docs.filter(d => {
    const ts = d.data().ts?.toMillis?.() || 0;
    return ts < cutoff;
  });
  await Promise.all(toDelete.map(d => deleteDoc(doc(db, 'admin', 'data', 'logs', d.id))));
  return toDelete.length;
}