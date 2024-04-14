export default function EmptyState({ hint = 'Nothing here yet.' }) {
  return <p className="empty-state">{hint}</p>;
}
