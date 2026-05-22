import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { StudentFormDialog } from './StudentFormDialog';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2, Users, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { getGroupColor } from '@/lib/groups';
import type { Student } from '@/types';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'className' | 'grade' | 'group' | 'prio1' | 'prio2' | 'prio3' | 'prio4' | 'prio5';
type SortDir = 'asc' | 'desc';

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true });
}

function sortValue(s: Student, key: SortKey, projectName: (id: string) => string): string | number {
  switch (key) {
    case 'name': return `${s.lastName} ${s.firstName}`;
    case 'className': return s.className;
    case 'grade': return s.grade;
    case 'group': return s.groupId ?? '';
    case 'prio1': return s.priorities[0] ? projectName(s.priorities[0]) : '';
    case 'prio2': return s.priorities[1] ? projectName(s.priorities[1]) : '';
    case 'prio3': return s.priorities[2] ? projectName(s.priorities[2]) : '';
    case 'prio4': return s.priorities[3] ? projectName(s.priorities[3]) : '';
    case 'prio5': return s.priorities[4] ? projectName(s.priorities[4]) : '';
  }
}

export function StudentsTable() {
  const students = useStudentsStore((s) => s.students);
  const updateStudent = useStudentsStore((s) => s.updateStudent);
  const removeStudent = useStudentsStore((s) => s.removeStudent);
  const createGroup = useStudentsStore((s) => s.createGroup);
  const removeFromGroup = useStudentsStore((s) => s.removeFromGroup);
  const projects = useProjectsStore((s) => s.projects);
  const clearAssignments = useAssignmentsStore((s) => s.clear);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '?';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedStudents = useMemo(() => {
    const copy = [...students];
    copy.sort((a, b) => {
      const va = sortValue(a, sortKey, projectName);
      const vb = sortValue(b, sortKey, projectName);
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = compareStrings(String(va), String(vb));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
    // projectName depends on `projects` already in deps via students reference; include explicitly:
  }, [students, sortKey, sortDir, projects]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleCreateGroup() {
    const ids = [...selected];
    const result = createGroup(ids);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    clearAssignments();
    clearSelection();
    toast.success(`Gruppe mit ${ids.length} Schülern gebildet`);
  }

  // Pre-validate the "Gruppe bilden" button state
  const selectedStudents = students.filter((s) => selected.has(s.id));
  const canForm = (() => {
    if (selectedStudents.length < 2) return null;
    if (selectedStudents.some((s) => s.groupId)) return 'Schüler bereits in Gruppe';
    const grade = selectedStudents[0].grade;
    if (selectedStudents.some((s) => s.grade !== grade)) return 'Jahrgang muss übereinstimmen';
    return 'ok';
  })();

  if (students.length === 0) {
    return <p className="text-muted-foreground">Noch keine Schüler. Importiere Excel-Datei oder lege einen neuen Schüler an.</p>;
  }

  const hint = (() => {
    if (selected.size === 0) return 'Mind. 2 Schüler ankreuzen, um eine Gruppe zu bilden';
    if (canForm && canForm !== 'ok') return canForm;
    if (canForm === null && selectedStudents.length === 1) return 'Mindestens 2 Schüler ankreuzen';
    return null;
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 border rounded-lg p-3 bg-card">
        <span className="text-sm">
          {selected.size === 0 ? 'Keine Auswahl' : `${selected.size} ausgewählt`}
        </span>
        <Button
          size="sm"
          disabled={canForm !== 'ok'}
          onClick={handleCreateGroup}
        >
          <Users className="size-4 mr-2" />
          Gruppe bilden
        </Button>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        {selected.size > 0 && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={clearSelection}>
            Auswahl löschen
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <SortHead label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Klasse" col="className" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Jg." col="grade" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Gruppe" col="group" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 1" col="prio1" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 2" col="prio2" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 3" col="prio3" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 4" col="prio4" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <SortHead label="Prio 5" col="prio5" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((s) => {
              const color = s.groupId ? getGroupColor(s.groupId) : null;
              return (
                <TableRow
                  key={s.id}
                  className={cn(color && 'border-l-4', color?.ring.replace('ring-', 'border-l-'))}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggle(s.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{s.lastName}, {s.firstName}</TableCell>
                  <TableCell>{s.className}</TableCell>
                  <TableCell>{s.grade}</TableCell>
                  <TableCell>
                    {color ? (
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs', color.bg, color.text)}>
                        <Users className="size-3" />
                        {color.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <TableCell key={i} className="text-sm">
                      {s.priorities[i] ? projectName(s.priorities[i]) : '—'}
                    </TableCell>
                  ))}
                  <TableCell className="flex gap-1">
                    <StudentFormDialog
                      trigger={<Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>}
                      initial={s}
                      onSave={(data) => {
                        updateStudent(s.id, data);
                        clearAssignments();
                        toast.success(s.groupId ? 'Schüler + Gruppe aktualisiert' : 'Schüler aktualisiert');
                      }}
                    />
                    {s.groupId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Aus Gruppe entfernen"
                        onClick={() => {
                          removeFromGroup(s.id);
                          clearAssignments();
                          toast.success('Aus Gruppe entfernt');
                        }}
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`${s.firstName} ${s.lastName} löschen?`)) {
                          removeStudent(s.id);
                          clearAssignments();
                          toast.success('Schüler gelöscht');
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type SortHeadProps = {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (key: SortKey) => void;
};

function SortHead({ label, col, sortKey, sortDir, onClick }: SortHeadProps) {
  const active = sortKey === col;
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground',
          active ? 'text-foreground font-medium' : 'text-muted-foreground',
        )}
        onClick={() => onClick(col)}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </TableHead>
  );
}
