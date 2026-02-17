let idCounter = 0;

export function generateId() {
  return "el_" + Date.now().toString(36) + "_" + (idCounter++).toString(36);
}
