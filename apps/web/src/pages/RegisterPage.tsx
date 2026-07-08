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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await register({ email, password });
    navigate('/history', { replace: true });
  }

  return (
    <section className="panel panel--narrow">
      <h1>Register</h1>
      {error ? <Callout tone="danger">{error}</Callout> : null}
      <form className="stack" onSubmit={handleSubmit}>
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
