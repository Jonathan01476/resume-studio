import 'server-only';
// Text extraction only. Interpretation belongs to the AI service, not the parser.
export async function extractPdf(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loading = pdfjs.getDocument({ data: bytes, useSystemFonts: true, disableFontFace: true });
  try {
    const document = await loading.promise;
    if (document.numPages > 25) throw new Error('PDFs must contain 25 pages or fewer.');
    const pages: string[] = [];
    for (let page = 1; page <= document.numPages; page++) {
      const content = await (await document.getPage(page)).getTextContent();
      pages.push(
        content.items
          .map((item) =>
            'str' in item ? item.str + ('hasEOL' in item && item.hasEOL ? '\n' : ' ') : '',
          )
          .join(''),
      );
    }
    return pages
      .join('\n\n')
      .replace(/\u0000/g, '')
      .trim()
      .slice(0, 60000);
  } finally {
    await loading.destroy();
  }
}
