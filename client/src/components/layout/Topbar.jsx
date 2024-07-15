import GlobalSearch from '../search/GlobalSearch.jsx';
import NotificationsPanel from '../notifications/NotificationsPanel.jsx';

export default function Topbar({ title }) {
  return (
    <header className="topbar">
      <h2 className="topbar-title">{title}</h2>
      <GlobalSearch />
      <NotificationsPanel />
    </header>
  );
}
