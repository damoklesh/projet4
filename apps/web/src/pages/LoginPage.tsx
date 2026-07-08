import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
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
    <section className="panel panel--narrow">
      <h1>Login</h1>
      {validationError ? <Callout tone="danger">{validationError}</Callout> : null}
      {error ? <Callout tone="danger">{error}</Callout> : null}
      <form className="stack" noValidate onSubmit={handleSubmit}>
        <Input label="Email" name="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
        <Input
          label="Password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
        <Button disabled={isLoading} icon={<LogIn size={16} />} type="submit">
          Login
        </Button>
      </form>
      <p>
        <Link to="/register">Create an account</Link>
      </p>
    </section>
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
