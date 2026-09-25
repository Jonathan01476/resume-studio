import fs from 'node:fs/promises';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const loading = getDocument({
  data: new Uint8Array(await fs.readFile('test-results/resume-letter.pdf')),
  useSystemFonts: true,
});
const document = await loading.promise;
console.log('Pages:', document.numPages);
for (let n = 1; n <= document.numPages; n++) {
  const page = await document.getPage(n);
  const viewport = page.getViewport({ scale: 1.5 });
  console.log('Page', n, 'dimensions (points):', page.view.join(', '));
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  await fs.writeFile(`test-results/print-page-${n}.png`, canvas.toBuffer('image/png'));
  const content = await page.getTextContent();
  console.log(
    'Text:',
    content.items
      .filter((i) => 'str' in i)
      .map((i) => i.str)
      .join(' ')
      .slice(-400),
  );
}
await loading.destroy();
