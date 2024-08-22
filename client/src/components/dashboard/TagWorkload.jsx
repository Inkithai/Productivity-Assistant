export function TagWorkload({ byTag }) {
  const peak = Math.max(1, ...byTag.map((row) => row.open));

  if (byTag.length === 0) {
    return <p className="muted">No tagged open tasks.</p>;
  }

  return (
    <ul className="workload-list">
      {byTag.map((row) => (
        <li key={row.tag}>
          <span className="workload-label">#{row.tag}</span>
          <span className="workload-bar" aria-label={`${row.open} open tasks`}>
            <span className="workload-fill" style={{ width: `${(row.open / peak) * 100}%` }} />
          </span>
          <span className="workload-count">{row.open}</span>
        </li>
      ))}
    </ul>
  );
}
