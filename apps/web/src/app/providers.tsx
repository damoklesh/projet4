import { useEffect, type PropsWithChildren } from 'react';
import { useAuthStore } from '../features/auth/auth.store';

export function AppProviders({ children }: PropsWithChildren) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
