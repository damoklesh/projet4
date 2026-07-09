import { copyTextToClipboard } from './clipboard';

describe('copyTextToClipboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the async Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    await copyTextToClipboard('https://example.com/share/token');

    expect(writeText).toHaveBeenCalledWith('https://example.com/share/token');
  });

  it('falls back to a temporary textarea when Clipboard API is unavailable', async () => {
    Object.assign(navigator, { clipboard: undefined });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.assign(document, { execCommand });

    await copyTextToClipboard('https://example.com/share/token');

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).not.toBeInTheDocument();
  });

  it('falls back when Clipboard API rejects', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
      },
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.assign(document, { execCommand });

    await copyTextToClipboard('https://example.com/share/token');

    expect(execCommand).toHaveBeenCalledWith('copy');
  });
});
