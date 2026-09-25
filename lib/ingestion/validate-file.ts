export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export function identifyFile(bytes: Uint8Array, declared: string): string {
  if (!bytes.length || bytes.length > MAX_FILE_BYTES)
    throw new Error('Choose a nonempty file smaller than 3 MB.');
  const starts = (values: number[]) => values.every((value, index) => bytes[index] === value);
  if (declared === 'application/pdf' && starts([37, 80, 68, 70, 45])) return declared;
  if (declared === 'image/png' && starts([137, 80, 78, 71, 13, 10, 26, 10])) return declared;
  if (declared === 'image/jpeg' && starts([255, 216, 255])) return declared;
  if (
    declared === 'image/webp' &&
    new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  )
    return declared;
  if (declared === 'text/plain') {
    const value = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (!value.includes('\u0000')) return declared;
  }
  throw new Error('Unsupported or invalid file. Use PDF, PNG, JPEG, WebP, or UTF-8 text.');
}
