import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';

const { loginMock, storeState } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  storeState: {
    current: undefined as
      | {
          login: ReturnType<typeof vi.fn>;
          error: string | null;
          isLoading: boolean;
          isAuthenticated: boolean;
          logout: ReturnType<typeof vi.fn>;
          user: null;
        }
      | undefined,
  },
}));

vi.mock('../features/auth/auth.store', () => ({
  useAuthStore: vi.fn((selector: (state: NonNullable<typeof storeState.current>) => unknown) =>
    selector(storeState.current as NonNullable<typeof storeState.current>),
  ),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockResolvedValue(undefined);
    storeState.current = {
      login: loginMock,
      error: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
      user: null,
    };
  });

  it('shows a clear client-side error when email is missing and does not submit', async () => {
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /^connexion$/i }));

    expect(await screen.findByText(/email est obligatoire/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('shows a clear client-side error when password is missing and does not submit', async () => {
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /^connexion$/i }));

    expect(await screen.findByText(/mot de passe est obligatoire/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('submits credentials and redirects to the personal area', async () => {
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /^connexion$/i }));

    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123',
    });
    expect(await screen.findByText(/personal area/i)).toBeInTheDocument();
  });

  it('displays generic authentication errors clearly', () => {
    storeState.current = {
      ...storeState.current!,
      error: 'Invalid email or password.',
    };
    renderLoginPage();

    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });
});

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/history" element={<h1>Personal area</h1>} />
        <Route path="/upload" element={<h1>Upload</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}
