// Unique session prefix prevents ID collisions when two users open the board
// at the same millisecond (both idCounter and timestamp would be identical).
const SESSION_ID = Math.random().toString(36).slice(2, 7);
let idCounter = 0;

export function generateId() {
  return `el_${Date.now().toString(36)}_${SESSION_ID}_${(idCounter++).toString(36)}`;
}