import { render, screen } from '@testing-library/react';
import { UploadPage } from './UploadPage';

describe('UploadPage', () => {
  it('renders the upload form', () => {
    render(<UploadPage />);
    expect(screen.getByRole('heading', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
