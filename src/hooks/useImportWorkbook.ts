import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { utils, type WorkBook } from 'xlsx';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { readWorkbook } from '@/excel/readWorkbook';

export function useImportWorkbook(open: boolean, externalFile?: File | null) {
  const { t } = useTranslation('app');
  const [fileName, setFileName] = useState('');
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [sheetName, setSheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const invalidate = useCallback(() => {
    request.current++;
  }, []);
  const reset = useCallback(() => {
    invalidate();
    setFileName('');
    setWorkbook(null);
    setSheetName('');
    setLoading(false);
    if (fileRef.current) fileRef.current.value = '';
  }, [invalidate]);
  const handleFile = useCallback(
    async (file: File) => {
      const token = ++request.current;
      setFileName(file.name);
      setWorkbook(null);
      setLoading(true);
      try {
        const next = await readWorkbook(file);
        if (request.current !== token) return;
        if (!next.SheetNames.length) throw new Error('Empty workbook');
        setWorkbook(next);
        setSheetName(next.SheetNames[0]);
      } catch {
        if (request.current !== token) return;
        reset();
        toast.error(t('common.fileReadFailed'));
      } finally {
        if (request.current === token) setLoading(false);
      }
    },
    [reset, t],
  );
  useEffect(() => {
    if (!open) reset();
    else if (externalFile) void handleFile(externalFile);
    return invalidate;
  }, [open, externalFile, handleFile, reset, invalidate]);
  const rows = useMemo(
    () =>
      workbook && workbook.Sheets[sheetName]
        ? utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '' })
        : null,
    [workbook, sheetName],
  );
  return { rows, workbook, fileName, sheetName, setSheetName, loading, fileRef, handleFile, reset };
}
