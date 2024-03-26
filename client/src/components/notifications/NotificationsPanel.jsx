import { useEffect, useRef, useState } from 'react';

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications.js';
import useSocket from '../../hooks/useSocket.js';
import { formatDate } from '../../utils/dates.js';

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    listNotifications()
      .then((data) => !cancelled && (setNotifications(data.notifications), setUnread(data.unreadCount)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onClickOutside(event) {
      if (open && panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useSocket('reminder:due', (payload) => {
    setUnread((count) => count + 1);
    setNotifications((prev) => [
      {
        _id: payload.id || `live-${Date.now()}`,
        type: 'reminder',
        title: payload.title,
        body: payload.message || '',
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  });

  async function handleMarkRead(id) {
    const { notification } = await markNotificationRead(id);
    setNotifications((prev) => prev.map((item) => (item._id === id ? notification : item)));
    setUnread((count) => Math.max(0, count - 1));
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnread(0);
  }

  return (
    <div className="notifications" ref={panelRef}>
      <button
        type="button"
        className="icon-btn bell"
        aria-label={`Notifications (${unread} unread)`}
        onClick={() => setOpen((value) => !value)}
      >
        🔔
        {unread > 0 && <span className="bell-count">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notifications-panel card">
          <header className="editor-head">
            <h3>Notifications</h3>
            {unread > 0 && (
              <button type="button" className="btn-ghost" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
          </header>
          {notifications.length === 0 ? (
            <p className="muted">You're all caught up.</p>
          ) : (
            <ul className="notification-list">
              {notifications.slice(0, 10).map((item) => (
                <li key={item._id} className={item.read ? '' : 'notification-unread'}>
                  <button type="button" className="notification-row" onClick={() => !item.read && handleMarkRead(item._id)}>
                    <span className="notification-title">{item.title}</span>
                    {item.body && <span className="notification-body">{item.body}</span>}
                    <span className="muted">{formatDate(item.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
