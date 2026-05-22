import { useActiveDistribution } from '@/store/useAssignmentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { DistributionInfoPopover } from './DistributionInfoPopover';

export function StatsPanel() {
  const activeDist = useActiveDistribution();
  const assignments = activeDist?.assignments ?? [];
  const lastRun = activeDist?.run ?? null;
  const studentCount = useStudentsStore((s) => s.students.length);
  const projects = useProjectsStore((s) => s.projects);

  const byPrio = [0, 0, 0, 0, 0];
  let notInTop5 = 0;
  let unassigned = 0;
  for (const a of assignments) {
    if (a.projectId === null) unassigned++;
    else if (a.priorityRank === null) notInTop5++;
    else byPrio[a.priorityRank - 1]++;
  }
  const assignedTotal = studentCount - unassigned;
  const manualCount = assignments.filter((a) => a.manuallyEdited).length;

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div><strong>Verteilt:</strong> {assignedTotal}/{studentCount}</div>
        <div className="text-destructive"><strong>Unverteilt:</strong> {unassigned}</div>
        <div>
          <strong>Prio:</strong>{' '}
          {byPrio.map((c, i) => (
            <span key={i} className="ml-1">P{i + 1}: {c}</span>
          ))}
          <span className="ml-1 text-muted-foreground">außerhalb: {notInTop5}</span>
        </div>
        {manualCount > 0 && <div className="text-muted-foreground"><strong>Manuell:</strong> {manualCount}</div>}
        {projects.length > 0 && (
          <div className="text-muted-foreground">
            <strong>Projekte:</strong> {projects.length}
          </div>
        )}
        {lastRun && activeDist && (
          <div className="text-muted-foreground ml-auto inline-flex items-center gap-1.5">
            <span>Score: {lastRun.score}</span>
            <DistributionInfoPopover distribution={activeDist} />
            <span>·</span>
            <span>{new Date(lastRun.timestamp).toLocaleString('de-DE')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
