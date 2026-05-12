import { writeFile } from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TableView } from '@/components/distribution/TableView';
import { BoardView } from '@/components/distribution/BoardView';
import { StatsPanel } from '@/components/distribution/StatsPanel';
import { buildExportWorkbook } from '@/excel/exportDistribution';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useStaleAssignments } from '@/hooks/useStaleAssignments';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function DistributionPage() {
  const navigate = useNavigate();
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);
  const assignments = useAssignmentsStore((s) => s.assignments);
  const { stale, reason } = useStaleAssignments();

  function handleExport() {
    const wb = buildExportWorkbook(students, projects, assignments);
    const date = new Date().toISOString().slice(0, 10);
    writeFile(wb, `projektverteilung-${date}.xlsx`);
    toast.success('Excel-Export gestartet');
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Verteilung</h1>
        <Button onClick={handleExport} disabled={assignments.length === 0}>
          <Download className="size-4 mr-2" />Excel exportieren
        </Button>
      </div>
      {stale && (
        <div className="border border-amber-400 bg-amber-50 text-amber-900 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm">⚠ {reason} — Verteilung ist möglicherweise nicht mehr aktuell.</span>
          <Button size="sm" variant="outline" onClick={() => navigate('/optimize')}>Neu berechnen</Button>
        </div>
      )}
      <StatsPanel />
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Tabelle</TabsTrigger>
          <TabsTrigger value="board">Projekte</TabsTrigger>
        </TabsList>
        <TabsContent value="table"><TableView /></TabsContent>
        <TabsContent value="board"><BoardView /></TabsContent>
      </Tabs>
    </div>
  );
}
