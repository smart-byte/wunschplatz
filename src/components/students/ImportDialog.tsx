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
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { parseStudentRows, type ParseResult } from '@/excel/importStudents';
import { HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const projects = useProjectsStore((s) => s.projects);
  const setStudents = useStudentsStore((s) => s.setStudents);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

  function parseSheet(wb: WorkBook, name: string) {
    const sheet = wb.Sheets[name];
    const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    const parsed = parseStudentRows(rows as unknown[][], projects);
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
  }

  function handleConfirm() {
    if (!result) return;
    const withIds = result.students.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
    }));
    setStudents(withIds);
    clearAssignments();
    toast.success(`${withIds.length} Schüler importiert`);
    setOpen(false);
    reset();
  }

  const sheetNames = workbook?.SheetNames ?? [];
  const showSheetPicker = sheetNames.length > 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button>Excel importieren</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Schüler aus Excel importieren
            <ImportHelp />
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
              <ImportHelpContent />
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
                Datei enthält mehrere Mappen. Wähle die mit den Schülerdaten.
              </p>
            </div>
          )}

          {projects.length === 0 && (
            <p className="text-sm text-destructive">
              Noch keine Projekte angelegt. Lege erst Projekte an, sonst können Prioritäten nicht zugeordnet werden.
            </p>
          )}
          {result && result.missingColumns.length > 0 && (
            <div className="text-sm text-destructive">
              <p>Pflichtspalten fehlen{showSheetPicker ? ' in dieser Mappe' : ' im Excel'}:</p>
              <ul className="list-disc pl-5">
                {result.missingColumns.map((c) => <li key={c}>{c}</li>)}
              </ul>
              <p className="mt-2 text-muted-foreground">
                Erwartet: Vorname, Nachname, Klasse, Jahrgang, Prio1-5 (auch englische Namen unterstützt).
              </p>
            </div>
          )}
          {result && result.missingColumns.length === 0 && (
            <>
              <p className="text-sm">
                Gefunden: <strong>{result.students.length}</strong> gültige Schüler-Zeile{result.students.length === 1 ? '' : 'n'}
                {result.errors.length > 0 && <>, <strong className="text-destructive">{result.errors.length}</strong> Fehler/Warnungen</>}
              </p>
              {result.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded p-2 text-xs">
                  {result.errors.map((e, i) => (
                    <div key={i}>Zeile {e.rowIndex + 1}: {e.message}</div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Achtung: Import ersetzt alle bisherigen Schüler und setzt die Verteilung zurück.
              </p>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button
            disabled={!result || result.missingColumns.length > 0 || result.students.length === 0}
            onClick={handleConfirm}
          >
            {result?.students.length ?? 0} importieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportHelp() {
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
        <ImportHelpContent />
      </PopoverContent>
    </Popover>
  );
}

function ImportHelpContent() {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="font-medium text-sm">Excel-Format für Schüler-Import</div>
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
            <tr><td className="pr-2 align-top">Vorname</td><td>Vorname · First Name · FirstName</td></tr>
            <tr><td className="pr-2 align-top">Nachname</td><td>Nachname · Last Name · LastName · Name</td></tr>
            <tr><td className="pr-2 align-top">Klasse</td><td>Klasse · Class</td></tr>
            <tr><td className="pr-2 align-top">Jahrgang</td><td>Jahrgang · Grade · Stufe · Jahrgangsstufe</td></tr>
            <tr><td className="pr-2 align-top">Prio 1-5</td><td>Prio1, Prio 1, Priorität 1, Priority 1 …</td></tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="font-medium mb-1">Beispiel</div>
        <pre className="rounded border bg-background p-2 text-[10px] leading-relaxed overflow-x-auto">{`Vorname  | Nachname  | Klasse | Jahrgang | Prio1   | Prio2 | Prio3 | Prio4   | Prio5
Anna     | Müller    | 7a     | 7        | Schach  | Yoga  | Comic | Theater | Kochen
Ben      | Schmidt   | 7b     | 7        | Theater | Yoga  | Comic | Schach  | Kochen`}</pre>
      </div>

      <div>
        <div className="font-medium mb-1">Regeln</div>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Jahrgang muss eine Zahl zwischen 5 und 13 sein.</li>
          <li>Prio-Werte müssen exakt den Projektnamen aus dem Reiter „Projekte" entsprechen (case-insensitiv).</li>
          <li>Prios untereinander müssen verschieden sein.</li>
          <li>Leere Prio-Zellen sind OK (≤5 Prios möglich). Auch „-", „–" oder „—" gilt als leer.</li>
          <li>Mehrere Mappen → Auswahl-Dropdown erscheint.</li>
        </ul>
      </div>
    </div>
  );
}
