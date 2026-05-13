import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useDistributionData } from '@/hooks/useDistributionData';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function TableView() {
  const { rows, projects } = useDistributionData();
  const updateAssignment = useAssignmentsStore((s) => s.updateAssignment);
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'notInTop5' | 'manual'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === 'unassigned' && r.assignment?.projectId !== null) return false;
      if (filter === 'notInTop5' && r.assignment?.priorityRank !== null) return false;
      if (filter === 'manual' && !r.assignment?.manuallyEdited) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.student.firstName.toLowerCase().includes(q) ||
          r.student.lastName.toLowerCase().includes(q) ||
          r.student.className.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, filter, search]);

  function handleChange(studentId: string, projectId: string) {
    const newId = projectId === '__none__' ? null : projectId;
    if (newId) {
      const target = projects.find((p) => p.id === newId)!;
      const student = rows.find((r) => r.student.id === studentId)!.student;
      if (!target.grades.includes(student.grade)) {
        if (!confirm(`Projekt "${target.name}" akzeptiert nur Jahrgänge ${target.grades.join(', ')}. Trotzdem zuweisen?`)) return;
      }
      const currentLoad = rows.filter((r) => r.assignment?.projectId === newId && r.student.id !== studentId).length;
      if (currentLoad >= target.maxCapacity) {
        if (!confirm(`Projekt "${target.name}" ist voll (${currentLoad}/${target.maxCapacity}). Trotzdem zuweisen?`)) return;
      }
    }
    updateAssignment(studentId, newId);
    toast.success('Zuweisung geändert');
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground">Keine Schüler. Importiere zuerst Schüler und starte die Berechnung.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Input placeholder="Suche…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unassigned' | 'notInTop5' | 'manual')}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle anzeigen</SelectItem>
            <SelectItem value="unassigned">Nur unverteilt</SelectItem>
            <SelectItem value="notInTop5">Nicht in Top5</SelectItem>
            <SelectItem value="manual">Manuell geändert</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} / {rows.length}</span>
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schüler</TableHead>
              <TableHead>Klasse</TableHead>
              <TableHead>Jg.</TableHead>
              <TableHead>Prios</TableHead>
              <TableHead>Zugewiesen</TableHead>
              <TableHead>Rang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const compatProjects = projects.filter((p) => p.grades.includes(r.student.grade));
              const incompatible = projects.filter((p) => !p.grades.includes(r.student.grade));
              return (
                <TableRow key={r.student.id} className={r.assignment?.manuallyEdited ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">{r.student.lastName}, {r.student.firstName}</TableCell>
                  <TableCell>{r.student.className}</TableCell>
                  <TableCell>{r.student.grade}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {r.student.priorities.map((id) => projects.find((p) => p.id === id)?.name ?? '?').join(', ')}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.assignment?.projectId ?? '__none__'}
                      onValueChange={(v) => handleChange(r.student.id, v)}
                    >
                      <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— unverteilt —</SelectItem>
                        {compatProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                        {incompatible.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-xs text-muted-foreground">Jahrgang nicht passend:</div>
                            {incompatible.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name} ⚠</SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {r.assignment?.priorityRank ? (
                      <Badge variant="secondary">Prio {r.assignment.priorityRank}</Badge>
                    ) : r.assignment?.projectId === null ? (
                      <Badge variant="destructive">—</Badge>
                    ) : (
                      <Badge variant="outline">außer</Badge>
                    )}
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
