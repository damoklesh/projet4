import { render, screen } from '@testing-library/react';
import { UploadPage } from './UploadPage';

describe('UploadPage', () => {
  it('renders the upload empty state', () => {
    render(<UploadPage />);
    expect(screen.getByText(/tu veux partager un fichier/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choisir un fichier/i })).toBeInTheDocument();
  });
});
