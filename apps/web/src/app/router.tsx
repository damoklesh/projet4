import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { HistoryPage } from '../pages/HistoryPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ShareLinkPage } from '../pages/ShareLinkPage';
import { UploadPage } from '../pages/UploadPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/upload', element: <UploadPage /> },
      { path: '/s/:token', element: <ShareLinkPage /> },
      { path: '/share/:token', element: <ShareLinkPage /> },
      {
        path: '/history',
        element: (
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <Navigate to="/upload" replace /> },
    ],
  },
]);
