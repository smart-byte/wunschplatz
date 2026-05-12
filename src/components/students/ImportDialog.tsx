import { useRef, useState } from 'react';
import { read, utils } from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { parseStudentRows, type ParseResult } from '@/excel/importStudents';
import { toast } from 'sonner';

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const projects = useProjectsStore((s) => s.projects);
  const setStudents = useStudentsStore((s) => s.setStudents);
  const clearAssignments = useAssignmentsStore((s) => s.clear);

  async function handleFile(file: File) {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = read(buf);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    const parsed = parseStudentRows(rows as unknown[][], projects);
    setResult(parsed);
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
    setResult(null);
    setFileName('');
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setResult(null); setFileName(''); } }}>
      <DialogTrigger asChild>
        <Button>Excel importieren</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Schüler aus Excel importieren</DialogTitle>
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
          {projects.length === 0 && (
            <p className="text-sm text-destructive">
              Noch keine Projekte angelegt. Lege erst Projekte an, sonst können Prioritäten nicht zugeordnet werden.
            </p>
          )}
          {result && result.missingColumns.length > 0 && (
            <div className="text-sm text-destructive">
              <p>Pflichtspalten fehlen im Excel:</p>
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
