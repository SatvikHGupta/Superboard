import { useState } from 'react';
import { createBoard } from '../../firebase/boardService.js';

export default function CreateBoard({ user, onCreated }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (creating) return;
    
    const boardName = name.trim() || 'Untitled Whiteboard';
    setCreating(true);
    setError('');
    
    try {
      const newBoardId = await createBoard(
        user.uid,
        user.email,
        user.displayName || user.email,
        boardName
      );
      console.log('Board created successfully:', newBoardId);
      setName('');
      
      // Force refresh with a small delay to ensure Firestore has propagated
      setTimeout(() => {
        if (onCreated) onCreated();
      }, 500);
    } catch (err) {
      console.error('Create board error:', err);
      setError('Failed to create board. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
    setCreating(false);
  }

  return (
    <div>
      <form className="create-board-form" onSubmit={handleSubmit}>
        <input
          className="create-board-input"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New whiteboard name..."
          maxLength={50}
          disabled={creating}
        />
        <button className="btn btn-primary" type="submit" disabled={creating}>
          {creating ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          )}
          {creating ? 'Creating...' : 'Create'}
        </button>
      </form>
      
      {error && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--r-md)',
          color: 'var(--red)',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}