import { LogOut, Upload } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/auth.store';
import { Button } from '../ui/Button';

export function Header() {
  const { isAuthenticated, logout, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    logout: state.logout,
    user: state.user,
  }));

  return (
    <header className="header">
      <Link className="header__brand" to="/upload">
        DataShare
      </Link>
      <nav className="header__nav" aria-label="Primary navigation">
        <NavLink to="/upload">Upload</NavLink>
        {isAuthenticated ? <NavLink to="/history">History</NavLink> : null}
      </nav>
      <div className="header__actions">
        {isAuthenticated ? (
          <>
            <span className="header__user">{user?.email}</span>
            <Button icon={<LogOut size={16} />} onClick={logout} variant="secondary">
              Sign out
            </Button>
          </>
        ) : (
          <>
            <NavLink className="link-button" to="/login">
              Login
            </NavLink>
            <NavLink className="link-button link-button--primary" to="/register">
              Register
            </NavLink>
          </>
        )}
        <NavLink className="icon-link" title="Upload" to="/upload">
          <Upload size={18} />
        </NavLink>
      </div>
    </header>
  );
}
