import { useEffect, useMemo, useState } from 'react';
import { useImportWorkbook } from '@/hooks/useImportWorkbook';
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
import { parseStudentRows, type ParseResult } from '@/excel/importStudents';
import { commitImportedStudents } from '@/store/commitImportedStudents';
import { useRoundsStore } from '@/store/useRoundsStore';
import { parseFormResponses, type FormImportResult } from '@/forms/importFormResponses';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

type ImportDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  externalFile?: File | null;
  defaultMode?: ImportMode;
};

export type ImportMode = 'excel' | 'forms';

export function ImportDialog({
  open: externalOpen,
  onOpenChange,
  externalFile,
  defaultMode = 'excel',
}: ImportDialogProps = {}) {
  const { t } = useTranslation('app');
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };
  const [mode, setMode] = useState<ImportMode>(defaultMode);
  const activeRound = useRoundsStore((s) => s.rounds.find((r) => r.id === s.activeRoundId));
  const versions = useMemo(
    () =>
      activeRound?.blueprint
        ? [...(activeRound.blueprintHistory ?? []), activeRound.blueprint]
        : [],
    [activeRound],
  );
  const [version, setVersion] = useState('');
  const blueprint =
    versions.length === 1 ? versions[0] : version ? versions[Number(version) - 1] : undefined;
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
  const projects = useProjectsStore((s) => s.projects);
  const canImportForms = versions.length > 0;
  const result = useMemo<ParseResult | FormImportResult | null>(() => {
    if (!rows) return null;
    return mode === 'forms'
      ? blueprint
        ? parseFormResponses(rows, projects, blueprint)
        : null
      : parseStudentRows(rows, projects);
  }, [rows, mode, projects, blueprint]);
  const blockingErrors = result?.errors.some((error) => error.severity === 'error');
  useEffect(() => {
    setMode(defaultMode);
    if (!open) setVersion('');
  }, [open, defaultMode]);
  function reset() {
    resetWorkbook();
    setMode(defaultMode);
    setVersion('');
  }

  function handleConfirm() {
    if (
      !result ||
      blockingErrors ||
      loading ||
      result.missingColumns.length ||
      !result.students.length
    )
      return;
    const { count, groupCount } = commitImportedStudents(result.students);
    const groupSuffix = groupCount > 0 ? t('import.groupSuffix', { count: groupCount }) : '';
    toast.success(t('import.imported', { count }) + groupSuffix);
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
            {t('students.importExcel')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t(mode === 'forms' ? 'import.formsTitle' : 'import.title')}
            {mode === 'excel' && <ImportHelp />}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as ImportMode)}>
            <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="excel">{t('import.tabExcel')}</TabsTrigger>
              <TabsTrigger value="forms">{t('import.tabForms')}</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === 'forms' && !canImportForms && (
            <p className="text-sm text-muted-foreground">{t('import.formsHint')}</p>
          )}
          {mode === 'forms' && versions.length > 1 && (
            <div className="grid gap-2">
              <p className="text-sm">{t('import.templateVersionHint')}</p>
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger aria-label={t('import.templateVersion')}>
                  <SelectValue placeholder={t('import.templateVersion')} />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((item, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {t('import.templateVersionOption', {
                        n: i + 1,
                        date: new Date(item.generatedAt).toLocaleString(),
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {blueprint && (
                <p className="text-xs text-muted-foreground">
                  {blueprint.projectOptions.map((o) => o.label).join(' · ')}
                </p>
              )}
            </div>
          )}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={mode === 'forms' && !canImportForms}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={mode === 'forms' && !canImportForms}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4 mr-2" />
              {t('common.chooseFile')}
            </Button>
            {fileName && <p className="text-sm mt-2">{t('import.fileLabel', { fileName })}</p>}
          </div>

          {!fileName && mode === 'excel' && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <ImportHelpContent />
            </div>
          )}
          {!fileName && mode === 'forms' && blueprint && (
            <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              {t('import.formsFileHint')}
            </p>
          )}

          {showSheetPicker && (
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">
                {t('import.sheetLabel', { count: sheetNames.length })}
              </label>
              <Select value={sheetName} onValueChange={handleSheetChange}>
                <SelectTrigger
                  aria-label={t('import.sheetLabel', { count: sheetNames.length })}
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
              <p className="text-xs text-muted-foreground">{t('import.sheetHint')}</p>
            </div>
          )}

          {loading && <p role="status">{t('common.loadingFile')}</p>}
          {blockingErrors && (
            <p role="alert" className="text-sm text-destructive">
              {t('import.fixErrors')}
            </p>
          )}
          {projects.length === 0 && (
            <p className="text-sm text-destructive">{t('import.noProjectsWarning')}</p>
          )}
          {result && result.missingColumns.length > 0 && (
            <div className="text-sm text-destructive">
              <p>
                {t(showSheetPicker ? 'import.missingColumnsSheet' : 'import.missingColumnsFile')}
              </p>
              <ul className="list-disc pl-5">
                {result.missingColumns.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="mt-2 text-muted-foreground">
                {mode === 'forms' && blueprint
                  ? t('import.expectedFormColumns', {
                      priorities: blueprint.priorities.map((q) => q.title).join(', '),
                    })
                  : t('import.expectedExcelColumns')}
              </p>
            </div>
          )}
          {result && result.missingColumns.length === 0 && (
            <>
              <p className="text-sm">
                {t('import.foundPrefix')} <strong>{result.students.length}</strong>{' '}
                {t('import.validRow', { count: result.students.length })}
                {result.errors.length > 0 && (
                  <>
                    , <strong className="text-destructive">{result.errors.length}</strong>{' '}
                    {t('import.errorsWarnings')}
                  </>
                )}
              </p>
              {result.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded p-2 text-xs">
                  {result.errors.map((e, i) => (
                    <div
                      key={i}
                      className={e.severity === 'error' ? 'text-destructive' : 'text-amber-700'}
                    >
                      <strong>
                        {t(e.severity === 'error' ? 'import.errorLabel' : 'import.warningLabel')}
                        :{' '}
                      </strong>
                      {t('import.rowPrefix', { row: e.rowIndex + 1 })}{' '}
                      {t(`import.errors.${e.code}`, e.values)}
                    </div>
                  ))}
                </div>
              )}
              {'warnings' in result && result.warnings.length > 0 && (
                <div className="text-xs text-amber-600 space-y-0.5">
                  {result.warnings.map((warning, i) => (
                    <div key={i}>{t(`import.warnings.${warning.code}`, warning.values)}</div>
                  ))}
                </div>
              )}
              {'duplicatesRemoved' in result && result.duplicatesRemoved > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('import.duplicatesRemoved', { count: result.duplicatesRemoved })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{t('import.replaceWarning')}</p>
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
              result.students.length === 0
            }
            onClick={handleConfirm}
          >
            {t('import.confirm', { count: result?.students.length ?? 0 })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportHelp() {
  const { t } = useTranslation('app');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex text-muted-foreground hover:text-foreground"
          title={t('import.help.buttonTitle')}
          aria-label={t('import.help.ariaLabel')}
        >
          <HelpCircle className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[28rem] max-h-[70vh] overflow-y-auto p-4">
        <ImportHelpContent />
      </PopoverContent>
    </Popover>
  );
}

function ImportHelpContent() {
  const { t } = useTranslation('app');
  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="font-medium text-sm">{t('import.help.heading')}</div>
        <p className="text-muted-foreground mt-1">{t('import.help.intro')}</p>
      </div>

      <div>
        <div className="font-medium mb-1">{t('import.help.requiredHeading')}</div>
        <table className="w-full table-fixed [&_td:first-child]:w-1/3 [&_th:first-child]:w-1/3">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-normal">{t('import.help.columnHeader')}</th>
              <th className="text-left font-normal">{t('import.help.acceptedNamesHeader')}</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            <tr>
              <td className="pr-2 align-top">{t('import.help.columns.firstName')}</td>
              <td>Vorname · First Name · FirstName</td>
            </tr>
            <tr>
              <td className="pr-2 align-top">{t('import.help.columns.lastName')}</td>
              <td>Nachname · Last Name · LastName · Name</td>
            </tr>
            <tr>
              <td className="pr-2 align-top">{t('import.help.columns.class')}</td>
              <td>Klasse · Class</td>
            </tr>
            <tr>
              <td className="pr-2 align-top">{t('import.help.columns.grade')}</td>
              <td>Jahrgang · Grade · Stufe · Jahrgangsstufe</td>
            </tr>
            <tr>
              <td className="pr-2 align-top">{t('import.help.columns.priorities')}</td>
              <td>Prio1, Prio 1, Priorität 1, Priority 1 …</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="font-medium mb-1">{t('import.help.optionalHeading')}</div>
        <table className="w-full table-fixed [&_td:first-child]:w-1/3 [&_th:first-child]:w-1/3">
          <tbody className="font-mono text-[11px]">
            <tr>
              <td className="pr-2 align-top">{t('import.help.columns.group')}</td>
              <td>Gruppe · Group</td>
            </tr>
          </tbody>
        </table>
        <p className="text-muted-foreground mt-1">{t('import.help.groupNote')}</p>
      </div>

      <div>
        <div className="font-medium mb-1">{t('import.help.exampleHeading')}</div>
        <pre className="rounded border bg-background p-2 text-[10px] leading-relaxed overflow-x-auto">
          {t('import.help.example')}
        </pre>
      </div>

      <div>
        <div className="font-medium mb-1">{t('import.help.rulesHeading')}</div>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>{t('import.help.rule1')}</li>
          <li>{t('import.help.rule2')}</li>
          <li>{t('import.help.rule3')}</li>
          <li>{t('import.help.rule4')}</li>
          <li>{t('import.help.rule5')}</li>
          <li>{t('import.help.rule6')}</li>
        </ul>
      </div>
    </div>
  );
}
