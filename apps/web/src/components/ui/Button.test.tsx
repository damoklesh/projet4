import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button text', () => {
    render(<Button>Upload</Button>);
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });
});
