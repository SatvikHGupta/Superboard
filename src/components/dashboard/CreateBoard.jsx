import { useState } from 'react';
import { createBoard } from '../../utils/storage.js';

export default function CreateBoard({ userId, userEmail, onCreated }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const boardName = name.trim() || 'Untitled Board';
    createBoard(userId, userEmail, boardName);
    setName('');
    onCreated();
  }

  return (
    <form className="create-board-form" onSubmit={handleSubmit}>
      <input
        className="create-board-input"
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="New board name..."
        maxLength={50}
      />
      <button className="btn btn-primary" type="submit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Create
      </button>
    </form>
  );
}
