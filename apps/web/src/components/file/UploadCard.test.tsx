import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadCard } from './UploadCard';

describe('UploadCard', () => {
  it('validates optional password length before upload', async () => {
    const onUpload = vi.fn();
    render(<UploadCard onUpload={onUpload} />);

    await userEvent.upload(
      screen.getByLabelText(/choose file/i),
      new File(['hello'], 'document.pdf', { type: 'application/pdf' }),
    );
    await userEvent.type(screen.getByLabelText(/mot de passe/i), '12345');
    await userEvent.click(screen.getByRole('button', { name: /televerser/i }));

    expect(await screen.findByText(/au moins 6 caracteres/i)).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('validates oversized files before upload', async () => {
    const onUpload = vi.fn();
    const file = new File(['hello'], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1_073_741_825 });
    render(<UploadCard onUpload={onUpload} />);

    await userEvent.upload(screen.getByLabelText(/choose file/i), file);

    expect(await screen.findByText(/limitee a 1 go/i)).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('submits a valid upload request', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const file = new File(['hello'], 'document.pdf', { type: 'application/pdf' });
    render(<UploadCard onUpload={onUpload} />);

    await userEvent.upload(screen.getByLabelText(/choose file/i), file);
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'secret1');
    await userEvent.selectOptions(screen.getByLabelText(/expiration/i), '7');
    await userEvent.click(screen.getByRole('button', { name: /televerser/i }));

    expect(onUpload).toHaveBeenCalledWith({
      file,
      password: 'secret1',
      expirationDays: 7,
    });
  });

  it('defaults expiration to 7 days', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const file = new File(['hello'], 'document.pdf', { type: 'application/pdf' });
    render(<UploadCard onUpload={onUpload} />);

    await userEvent.upload(screen.getByLabelText(/choose file/i), file);
    await userEvent.click(screen.getByRole('button', { name: /televerser/i }));

    expect(onUpload).toHaveBeenCalledWith({
      file,
      password: undefined,
      expirationDays: 7,
    });
  });
});
