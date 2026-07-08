import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';

const { registerMock, storeState } = vi.hoisted(() => ({
  registerMock: vi.fn(),
  storeState: {
    current: undefined as
      | {
          register: ReturnType<typeof vi.fn>;
          error: string | null;
          isLoading: boolean;
        }
      | undefined,
  },
}));

vi.mock('../features/auth/auth.store', () => ({
  useAuthStore: vi.fn((selector: (state: NonNullable<typeof storeState.current>) => unknown) =>
    selector(storeState.current as NonNullable<typeof storeState.current>),
  ),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerMock.mockResolvedValue(undefined);
    storeState.current = {
      register: registerMock,
      error: null,
      isLoading: false,
    };
  });

  it('shows a clear client-side error for invalid email and does not submit', async () => {
    renderRegisterPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/adresse email valide/i)).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('shows a clear client-side error for passwords shorter than 8 characters and does not submit', async () => {
    renderRegisterPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/8 caractères/i)).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('submits registration and redirects to the personal area', async () => {
    renderRegisterPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(registerMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123',
    });
    expect(await screen.findByText(/personal area/i)).toBeInTheDocument();
  });

  it('displays duplicate email errors clearly', async () => {
    storeState.current = {
      register: registerMock,
      error: 'Un compte existe déjà pour cet email.',
      isLoading: false,
    };
    renderRegisterPage();

    expect(screen.getByText(/compte existe déjà/i)).toBeInTheDocument();
  });
});

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/history" element={<h1>Personal area</h1>} />
        <Route path="/upload" element={<h1>Upload</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}
