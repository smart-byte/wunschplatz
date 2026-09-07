import { useMemo, useState } from 'react';
import { useImportWorkbook } from '@/hooks/useImportWorkbook';
import { commitProjects, reconcileProjectIds } from '@/store/commitProjects';
import { normalizeLabel } from '@/forms/normalizeLabel';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectsStore } from '@/store/useProjectsStore';
import { parseProjectRows } from '@/excel/importProjects';
import { HelpCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  externalFile?: File | null;
};

export function ProjectImportDialog({
  open: externalOpen,
  onOpenChange,
  externalFile,
}: Props = {}) {
  const { t } = useTranslation('app');
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };
  const [mode, setMode] = useState<'replace' | 'append'>('append');
  const projects = useProjectsStore((s) => s.projects);
  const {
    rows,
    workbook,
    fileName,
    sheetName,
    setSheetName: handleSheetChange,
    fileRef,
    handleFile,
    reset: resetWorkbook,
    loading,
  } = useImportWorkbook(open, externalFile);
  const result = useMemo(() => (rows ? parseProjectRows(rows) : null), [rows]);
  const duplicate =
    mode === 'append' &&
    result?.projects.find((p) =>
      projects.some((existing) => normalizeLabel(existing.name) === normalizeLabel(p.name)),
    );
  const blockingErrors = Boolean(result?.errors.length) || Boolean(duplicate);
  function reset() {
    resetWorkbook();
    setMode('append');
  }

  function handleConfirm() {
    if (
      !result ||
      blockingErrors ||
      loading ||
      result.missingColumns.length ||
      !result.projects.length
    )
      return;
    const next = reconcileProjectIds(result.projects, mode === 'replace' ? projects : []);
    commitProjects(mode === 'replace' ? next : [...projects, ...next]);
    toast.success(
      t(mode === 'replace' ? 'projects.import.importedReplace' : 'projects.import.importedAppend', {
        count: result.projects.length,
      }),
    );
    setOpen(false);
    reset();
  }

  const sheetNames = workbook?.SheetNames ?? [];
  const showSheetPicker = sheetNames.length > 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="size-4 mr-2" />
            {t('projects.importExcel')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('projects.import.title')}
            <ProjectImportHelp />
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4 mr-2" />
              {t('common.chooseFile')}
            </Button>
            {fileName && (
              <p className="text-sm mt-2">{t('projects.import.fileLabel', { fileName })}</p>
            )}
          </div>

          {!fileName && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <ProjectImportHelpContent />
            </div>
          )}

          {showSheetPicker && (
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">
                {t('projects.import.sheetLabel', { count: sheetNames.length })}
              </label>
              <Select value={sheetName} onValueChange={handleSheetChange}>
                <SelectTrigger
                  aria-label={t('projects.import.sheetLabel', { count: sheetNames.length })}
                  className="w-full sm:w-72"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sheetNames.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('projects.import.sheetHint')}</p>
            </div>
          )}

          {loading && <p role="status">{t('common.loadingFile')}</p>}
          {duplicate && (
            <p role="alert" className="text-sm text-destructive">
              {t('projects.import.errors.duplicateName', { name: duplicate.name })}
            </p>
          )}
          {blockingErrors && (
            <p role="alert" className="text-sm text-destructive">
              {t('import.fixErrors')}
            </p>
          )}
          {result && result.missingColumns.length > 0 && (
            <div className="text-sm text-destructive">
              <p>
                {t(
                  showSheetPicker
                    ? 'projects.import.missingColumnsSheet'
                    : 'projects.import.missingColumnsFile',
                )}
              </p>
              <ul className="list-disc pl-5">
                {result.missingColumns.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="mt-2 text-muted-foreground">{t('projects.import.expectedColumns')}</p>
            </div>
          )}
          {result && result.missingColumns.length === 0 && (
            <>
              <p className="text-sm">
                {t('projects.import.foundPrefix')} <strong>{result.projects.length}</strong>{' '}
                {t('projects.import.validRow', { count: result.projects.length })}
                {result.errors.length > 0 && (
                  <>
                    , <strong className="text-destructive">{result.errors.length}</strong>{' '}
                    {t('projects.import.errorsWarnings')}
                  </>
                )}
              </p>
              {result.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded p-2 text-xs">
                  {result.errors.map((e, i) => (
                    <div key={i}>
                      {t('projects.import.rowPrefix', { row: e.rowIndex + 1 })}{' '}
                      {t(`projects.import.errors.${e.code}`, e.values)}
                    </div>
                  ))}
                </div>
              )}
              {projects.length > 0 && (
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">{t('projects.import.modeLabel')}</label>
                  <Select value={mode} onValueChange={(v) => setMode(v as 'replace' | 'append')}>
                    <SelectTrigger
                      aria-label={t('projects.import.modeLabel')}
                      className="w-full sm:w-72"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="append">{t('projects.import.modeAppend')}</SelectItem>
                      <SelectItem value="replace">{t('projects.import.modeReplace')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {mode === 'replace' && (
                    <p className="text-xs text-destructive">
                      {t('projects.import.modeReplaceWarning')}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={
              loading ||
              blockingErrors ||
              !result ||
              result.missingColumns.length > 0 ||
              result.projects.length === 0
            }
            onClick={handleConfirm}
          >
            {t(
              mode === 'replace'
                ? 'projects.import.confirmReplace'
                : 'projects.import.confirmAppend',
              {
                count: result?.projects.length ?? 0,
              },
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectImportHelp() {
  const { t } = useTranslation('app');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex text-muted-foreground hover:text-foreground"
          title={t('projects.import.help.buttonTitle')}
          aria-label={t('projects.import.help.ariaLabel')}
        >
          <HelpCircle className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[28rem] max-h-[70vh] overflow-y-auto p-4">
        <ProjectImportHelpContent />
      </PopoverContent>
    </Popover>
  );
}

function ProjectImportHelpContent() {
  const { t } = useTranslation('app');
  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="font-medium text-sm">{t('projects.import.help.heading')}</div>
        <p className="text-muted-foreground mt-1">{t('projects.import.help.intro')}</p>
      </div>

      <div>
        <div className="font-medium mb-1">{t('projects.import.help.requiredHeading')}</div>
        <table className="w-full table-fixed [&_td:first-child]:w-1/3 [&_th:first-child]:w-1/3">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-normal">{t('projects.import.help.columnHeader')}</th>
              <th className="text-left font-normal">
                {t('projects.import.help.acceptedNamesHeader')}
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            <tr>
              <td className="pr-2 align-top">{t('projects.import.help.columns.name')}</td>
              <td>Name · Projekt · Project · Titel · Bezeichnung</td>
            </tr>
            <tr>
              <td className="pr-2 align-top">{t('projects.import.help.columns.grades')}</td>
              <td>Jahrgänge · Jahrgang · Grades · Stufen</td>
            </tr>
            <tr>
              <td className="pr-2 align-top">{t('projects.import.help.columns.max')}</td>
              <td>Max · Maximum · Max-Kapazität · Obergrenze</td>
            </tr>
            <tr>
              <td className="pr-2 align-top">{t('projects.import.help.columns.target')}</td>
              <td>Soll · Ziel · Target · Soll-Kapazität</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="font-medium mb-1">{t('projects.import.help.optionalHeading')}</div>
        <table className="w-full table-fixed [&_td:first-child]:w-1/3 [&_th:first-child]:w-1/3">
          <tbody className="font-mono text-[11px]">
            <tr>
              <td className="pr-2 align-top">{t('projects.import.help.columns.description')}</td>
              <td>Beschreibung · Description · Info · Details</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="font-medium mb-1">{t('projects.import.help.gradeFormatHeading')}</div>
        <p className="text-muted-foreground">{t('projects.import.help.gradeFormatIntro')}</p>
        <ul className="font-mono text-[11px] mt-1 space-y-0.5">
          <li>5-7 · 5–7 · 5—7 &nbsp;({t('projects.import.help.range')})</li>
          <li>5,6,7 · 5;6;7 · 5 6 7 &nbsp;({t('projects.import.help.list')})</li>
          <li>[5,6,7] &nbsp;({t('projects.import.help.brackets')})</li>
        </ul>
      </div>

      <div>
        <div className="font-medium mb-1">{t('projects.import.help.exampleHeading')}</div>
        <pre className="rounded border bg-background p-2 text-[10px] leading-relaxed overflow-x-auto">
          {t('projects.import.help.example')}
        </pre>
      </div>

      <div>
        <div className="font-medium mb-1">{t('projects.import.help.rulesHeading')}</div>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>{t('projects.import.help.rule1')}</li>
          <li>{t('projects.import.help.rule2')}</li>
          <li>{t('projects.import.help.rule3')}</li>
          <li>{t('projects.import.help.rule4')}</li>
        </ul>
      </div>
    </div>
  );
}
