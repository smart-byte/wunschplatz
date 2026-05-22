import { useRef, useState } from 'react';
import { read, utils } from 'xlsx';
import type { WorkBook } from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { parseProjectRows, type ProjectParseResult } from '@/excel/importProjects';
import { HelpCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

export function ProjectImportDialog() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ProjectParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const [mode, setMode] = useState<'replace' | 'append'>('append');
  const fileRef = useRef<HTMLInputElement>(null);
  const projects = useProjectsStore((s) => s.projects);
  const setProjects = useProjectsStore((s) => s.setProjects);
  const addProject = useProjectsStore((s) => s.addProject);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

  function parseSheet(wb: WorkBook, name: string) {
    const sheet = wb.Sheets[name];
    const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    const parsed = parseProjectRows(rows as unknown[][]);
    setResult(parsed);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = read(buf);
    setWorkbook(wb);
    const firstSheet = wb.SheetNames[0] ?? '';
    setSheetName(firstSheet);
    if (firstSheet) parseSheet(wb, firstSheet);
  }

  function handleSheetChange(name: string) {
    setSheetName(name);
    if (workbook) parseSheet(workbook, name);
  }

  function reset() {
    setResult(null);
    setFileName('');
    setWorkbook(null);
    setSheetName('');
    setMode('append');
  }

  function handleConfirm() {
    if (!result) return;
    if (mode === 'replace') {
      const withIds = result.projects.map((p) => ({
        ...p,
        id: crypto.randomUUID(),
      }));
      setProjects(withIds);
      clearAssignments();
    } else {
      for (const p of result.projects) addProject(p);
    }
    toast.success(
      `${result.projects.length} Projekte ${mode === 'replace' ? 'importiert (ersetzt)' : 'hinzugefügt'}`,
    );
    setOpen(false);
    reset();
  }

  const sheetNames = workbook?.SheetNames ?? [];
  const showSheetPicker = sheetNames.length > 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4 mr-2" />
          Excel importieren
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Projekte aus Excel importieren
            <ProjectImportHelp />
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="block text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {fileName && <p className="text-sm mt-2">Datei: {fileName}</p>}
          </div>

          {!fileName && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <ProjectImportHelpContent />
            </div>
          )}

          {showSheetPicker && (
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">
                Mappe wählen ({sheetNames.length} verfügbar)
              </label>
              <Select value={sheetName} onValueChange={handleSheetChange}>
                <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sheetNames.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Datei enthält mehrere Mappen. Wähle die mit den Projekt-Daten.
              </p>
            </div>
          )}

          {result && result.missingColumns.length > 0 && (
            <div className="text-sm text-destructive">
              <p>Pflichtspalten fehlen{showSheetPicker ? ' in dieser Mappe' : ' im Excel'}:</p>
              <ul className="list-disc pl-5">
                {result.missingColumns.map((c) => <li key={c}>{c}</li>)}
              </ul>
              <p className="mt-2 text-muted-foreground">
                Erwartet: Name, Jahrgänge, Max, Soll (Beschreibung optional).
              </p>
            </div>
          )}
          {result && result.missingColumns.length === 0 && (
            <>
              <p className="text-sm">
                Gefunden: <strong>{result.projects.length}</strong> gültige Projekt-Zeile{result.projects.length === 1 ? '' : 'n'}
                {result.errors.length > 0 && <>, <strong className="text-destructive">{result.errors.length}</strong> Fehler/Warnungen</>}
              </p>
              {result.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded p-2 text-xs">
                  {result.errors.map((e, i) => (
                    <div key={i}>Zeile {e.rowIndex + 1}: {e.message}</div>
                  ))}
                </div>
              )}
              {projects.length > 0 && (
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">Import-Modus</label>
                  <Select value={mode} onValueChange={(v) => setMode(v as 'replace' | 'append')}>
                    <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="append">Hinzufügen — bestehende Projekte bleiben</SelectItem>
                      <SelectItem value="replace">Ersetzen — alle Projekte werden überschrieben</SelectItem>
                    </SelectContent>
                  </Select>
                  {mode === 'replace' && (
                    <p className="text-xs text-destructive">
                      Achtung: Alle bestehenden Projekte werden gelöscht und die Verteilung zurückgesetzt.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button
            disabled={!result || result.missingColumns.length > 0 || result.projects.length === 0}
            onClick={handleConfirm}
          >
            {result?.projects.length ?? 0} {mode === 'replace' ? 'ersetzen' : 'hinzufügen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectImportHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex text-muted-foreground hover:text-foreground"
          title="Excel-Format anzeigen"
          aria-label="Hilfe"
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
  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="font-medium text-sm">Excel-Format für Projekt-Import</div>
        <p className="text-muted-foreground mt-1">
          Erste Zeile = Spaltenüberschriften. Reihenfolge egal, Erkennung case-insensitiv.
        </p>
      </div>

      <div>
        <div className="font-medium mb-1">Pflichtspalten</div>
        <table className="w-full">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-normal">Spalte</th>
              <th className="text-left font-normal">Akzeptierte Namen</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            <tr><td className="pr-2 align-top">Name</td><td>Name · Projekt · Project · Titel · Bezeichnung</td></tr>
            <tr><td className="pr-2 align-top">Jahrgänge</td><td>Jahrgänge · Jahrgang · Grades · Stufen</td></tr>
            <tr><td className="pr-2 align-top">Max</td><td>Max · Maximum · Max-Kapazität · Obergrenze</td></tr>
            <tr><td className="pr-2 align-top">Soll</td><td>Soll · Ziel · Target · Soll-Kapazität</td></tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="font-medium mb-1">Optionale Spalten</div>
        <table className="w-full">
          <tbody className="font-mono text-[11px]">
            <tr><td className="pr-2 align-top">Beschreibung</td><td>Beschreibung · Description · Info · Details</td></tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="font-medium mb-1">Jahrgang-Format</div>
        <p className="text-muted-foreground">
          Mehrere Schreibweisen möglich. Werte außerhalb 5-13 werden ignoriert.
        </p>
        <ul className="font-mono text-[11px] mt-1 space-y-0.5">
          <li>5-7 · 5–7 · 5—7 &nbsp;(Bereich)</li>
          <li>5,6,7 · 5;6;7 · 5 6 7 &nbsp;(Liste)</li>
          <li>[5,6,7] &nbsp;(mit Klammern)</li>
        </ul>
      </div>

      <div>
        <div className="font-medium mb-1">Beispiel</div>
        <pre className="rounded border bg-background p-2 text-[10px] leading-relaxed overflow-x-auto">{`Name              | Beschreibung           | Jahrgänge | Max | Soll
Schach-Akademie   | Eröffnungen, Endspiele | 5-13      | 20  | 16
Theater-AG        | Romeo und Julia        | 7-13      | 18  | 14
Programmieren     | Python für Anfänger    | 8,9,10    | 16  | 12`}</pre>
      </div>

      <div>
        <div className="font-medium mb-1">Regeln</div>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Mindestens ein gültiger Jahrgang (5-13) erforderlich.</li>
          <li>Max muss positiv sein, Soll zwischen 0 und Max liegen.</li>
          <li>Beim Import-Modus „Hinzufügen" bleiben bestehende Projekte erhalten.</li>
          <li>Mehrere Mappen → Auswahl-Dropdown erscheint.</li>
        </ul>
      </div>
    </div>
  );
}
