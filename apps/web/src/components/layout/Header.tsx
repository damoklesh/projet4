import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../features/auth/auth.store';
import { Button } from '../ui/Button';

export function Header() {
  const { isAuthenticated, logout, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    logout: state.logout,
    user: state.user,
  }));
  const isHistory = typeof window !== 'undefined' && window.location.pathname.startsWith('/history');

  function handleLogout() {
    logout();
    window.location.assign('/login');
  }

  return (
    <header className="header">
      <a className="header__brand" href="/upload">
        DataShare
      </a>
      <div className="header__actions">
        {isAuthenticated && isHistory ? (
          <>
            <span className="header__user">{user?.email}</span>
            <Button icon={<LogOut size={13} />} onClick={handleLogout} size="sm" variant="dark">
              Deconnexion
            </Button>
          </>
        ) : isAuthenticated ? (
          <Button onClick={() => window.location.assign('/history')} size="sm" variant="dark">
            Mon espace
          </Button>
        ) : (
          <Button onClick={() => window.location.assign('/login')} size="sm" variant="dark">
            Se connecter
          </Button>
        )}
      </div>
    </header>
  );
}
