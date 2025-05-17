import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import RemindersPage from './pages/RemindersPage.jsx';
import HabitsPage from './pages/HabitsPage.jsx';

// the chat page pulls in the socket connection, keep it out of the first paint
const AssistantPage = lazy(() => import('./pages/AssistantPage.jsx'));

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="assistant"
            element={
              <Suspense fallback={<p className="muted">Loading…</p>}>
                <AssistantPage />
              </Suspense>
            }
          />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="habits" element={<HabitsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
