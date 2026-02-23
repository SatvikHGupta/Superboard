export default function AdminBoardPagination({ currentPage, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce((acc, p, i, arr) => { if (i > 0 && arr[i - 1] !== p - 1) acc.push('…'); acc.push(p); return acc; }, []);

  const btn = (label, page, disabled) => (
    <button className="btn btn-ghost" onClick={() => onPage(page)} disabled={disabled}
      style={{ padding: '4px 10px', fontSize: 12 }}>{label}</button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 0', marginTop: 8 }}>
      {btn('«', 1, currentPage === 1)}
      {btn('‹', currentPage - 1, currentPage === 1)}
      {pages.map((p, i) => typeof p === 'string'
        ? <span key={i} style={{ fontSize: 12, color: 'var(--tx-4)', padding: '0 4px' }}>…</span>
        : <button key={p} onClick={() => onPage(p)}
            style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
              background: currentPage === p ? 'var(--a)' : 'var(--bg-3)',
              color: currentPage === p ? '#fff' : 'var(--tx-2)',
              border: '1px solid ' + (currentPage === p ? 'var(--a)' : 'var(--border)') }}>
            {p}
          </button>
      )}
      {btn('›', currentPage + 1, currentPage === totalPages)}
      {btn('»', totalPages, currentPage === totalPages)}
      <span style={{ fontSize: 12, color: 'var(--tx-4)' }}>Page {currentPage} of {totalPages}</span>
    </div>
  );
}
