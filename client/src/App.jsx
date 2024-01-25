import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<p className="muted">Your dashboard will live here.</p>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
