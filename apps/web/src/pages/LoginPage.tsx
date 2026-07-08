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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login({ email, password });
    const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/history';
    navigate(from, { replace: true });
  }

  return (
    <section className="panel panel--narrow">
      <h1>Login</h1>
      {error ? <Callout tone="danger">{error}</Callout> : null}
      <form className="stack" onSubmit={handleSubmit}>
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
