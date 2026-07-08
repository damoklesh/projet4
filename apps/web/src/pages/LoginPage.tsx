import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PublicPageLayout } from '../components/layout/PublicPageLayout';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../features/auth/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errorMessage = validateLoginForm(email, password);

    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    setValidationError(null);

    try {
      await login({ email, password });
      const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/history';
      navigate(from, { replace: true });
    } catch {
      // The auth store owns API error state for this page.
    }
  }

  return (
    <PublicPageLayout>
      <Card title="Connexion">
        {validationError ? <Callout tone="danger">{validationError}</Callout> : null}
        {error ? <Callout tone="danger">{error}</Callout> : null}
        <form className="stack" noValidate onSubmit={handleSubmit}>
          <Input
            label="Email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Saisissez votre email..."
            type="email"
            value={email}
          />
          <Input
            label="Mot de passe"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Saisissez votre mot de passe..."
            type="password"
            value={password}
          />
          <Link className="auth-switch" to="/register">
            Creer un compte
          </Link>
          <Button disabled={isLoading} icon={<LogIn size={13} />} size="sm" type="submit" variant="primary">
            Connexion
          </Button>
        </form>
      </Card>
    </PublicPageLayout>
  );
}

function validateLoginForm(email: string, password: string): string | null {
  if (!email.trim()) {
    return "L'email est obligatoire.";
  }

  if (!password) {
    return 'Le mot de passe est obligatoire.';
  }

  return null;
}
