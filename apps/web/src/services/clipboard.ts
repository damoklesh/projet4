export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Plain HTTP deployments can reject the async Clipboard API. Fall back
      // to the legacy selection command for demo environments.
    }
  }

  fallbackCopyText(text);
}

function fallbackCopyText(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const didCopy = document.execCommand('copy');
    if (!didCopy) {
      throw new Error('Copy command was rejected.');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
