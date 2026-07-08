import { UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../features/auth/auth.store';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errorMessage = validateRegistrationForm(email, password);

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
    <section className="panel panel--narrow">
      <h1>Register</h1>
      {validationError ? <Callout tone="danger">{validationError}</Callout> : null}
      {error ? <Callout tone="danger">{error}</Callout> : null}
      <form className="stack" noValidate onSubmit={handleSubmit}>
        <Input label="Email" name="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
        <Input
          label="Password"
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
        <Button disabled={isLoading} icon={<UserPlus size={16} />} type="submit">
          Register
        </Button>
      </form>
      <p>
        <Link to="/login">Use an existing account</Link>
      </p>
    </section>
  );
}

function validateRegistrationForm(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Veuillez saisir une adresse email valide.';
  }

  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  }

  return null;
}
