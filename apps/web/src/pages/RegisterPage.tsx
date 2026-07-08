import { UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicPageLayout } from '../components/layout/PublicPageLayout';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../features/auth/auth.store';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errorMessage = validateRegistrationForm(email, password, passwordConfirmation);

    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    setValidationError(null);

    try {
      await register({ email, password });
      navigate('/history', { replace: true });
    } catch {
      // The auth store owns API error state for this page.
    }
  }

  return (
    <PublicPageLayout>
      <Card title="Creer un compte">
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
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Saisissez votre mot de passe..."
            type="password"
            value={password}
          />
          <Input
            label="Verification du mot de passe"
            minLength={8}
            name="passwordConfirmation"
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            placeholder="Saisissez le meme mot de passe..."
            type="password"
            value={passwordConfirmation}
          />
          <Link className="auth-switch" to="/login">
            J'ai deja un compte
          </Link>
          <Button disabled={isLoading} icon={<UserPlus size={13} />} size="sm" type="submit" variant="primary">
            Creer mon compte
          </Button>
        </form>
      </Card>
    </PublicPageLayout>
  );
}

function validateRegistrationForm(email: string, password: string, passwordConfirmation: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Veuillez saisir une adresse email valide.';
  }

  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caracteres.';
  }

  if (password !== passwordConfirmation) {
    return 'Les mots de passe doivent correspondre.';
  }

  return null;
}
