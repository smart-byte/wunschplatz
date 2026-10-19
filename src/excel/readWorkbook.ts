import type { WorkBook } from 'xlsx';

export async function readWorkbook(file: Pick<File, 'name' | 'arrayBuffer'>): Promise<WorkBook> {
  // SheetJS is large; load it only once a file is actually read.
  const [{ read }, bytes] = await Promise.all([import('xlsx'), file.arrayBuffer()]);
  if (!/\.csv$/i.test(file.name)) return read(bytes);
  // Decode CSV explicitly: SheetJS assumes a legacy code page for bytes without a BOM.
  const prefix = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  const encoding =
    prefix[0] === 0xff && prefix[1] === 0xfe
      ? 'utf-16le'
      : prefix[0] === 0xfe && prefix[1] === 0xff
        ? 'utf-16be'
        : 'utf-8';
  let csv: string;
  try {
    csv = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch (error) {
    // German Excel saves "CSV (Trennzeichen-getrennt)" as Windows-1252, which is not valid UTF-8.
    if (encoding !== 'utf-8') throw error;
    csv = new TextDecoder('windows-1252').decode(bytes);
  }
  return read(csv, { type: 'string', raw: true });
}
