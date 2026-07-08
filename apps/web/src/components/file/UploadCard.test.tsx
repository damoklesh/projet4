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
    await userEvent.type(screen.getByLabelText(/password/i), '12345');
    await userEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('validates expiration range before upload', async () => {
    const onUpload = vi.fn();
    render(<UploadCard onUpload={onUpload} />);

    await userEvent.upload(
      screen.getByLabelText(/choose file/i),
      new File(['hello'], 'document.pdf', { type: 'application/pdf' }),
    );
    await userEvent.clear(screen.getByLabelText(/expiration/i));
    await userEvent.type(screen.getByLabelText(/expiration/i), '8');
    await userEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(await screen.findByText(/between 1 and 7 days/i)).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('submits a valid upload request', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const file = new File(['hello'], 'document.pdf', { type: 'application/pdf' });
    render(<UploadCard onUpload={onUpload} />);

    await userEvent.upload(screen.getByLabelText(/choose file/i), file);
    await userEvent.type(screen.getByLabelText(/password/i), 'secret1');
    await userEvent.clear(screen.getByLabelText(/expiration/i));
    await userEvent.type(screen.getByLabelText(/expiration/i), '7');
    await userEvent.type(screen.getByLabelText(/tags/i), 'facture');
    await userEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(onUpload).toHaveBeenCalledWith({
      file,
      password: 'secret1',
      expirationDays: 7,
      tags: 'facture',
    });
  });
});
