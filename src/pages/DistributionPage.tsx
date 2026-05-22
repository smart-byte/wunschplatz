import { useEffect, useState } from 'react';
import { writeFile } from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TableView } from '@/components/distribution/TableView';
import { BoardView } from '@/components/distribution/BoardView';
import { StatsPanel } from '@/components/distribution/StatsPanel';
import { DistributionSelector } from '@/components/distribution/DistributionSelector';
import { buildExportWorkbook } from '@/excel/exportDistribution';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useActiveDistribution } from '@/store/useAssignmentsStore';
import { useStaleAssignments } from '@/hooks/useStaleAssignments';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

const TAB_STORAGE_KEY = 'distribution.activeTab';

export default function DistributionPage() {
  const navigate = useNavigate();
  const students = useStudentsStore((s) => s.students);
  const projects = useProjectsStore((s) => s.projects);
  const activeDist = useActiveDistribution();
  const { stale, reason } = useStaleAssignments();

  const [tab, setTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'board';
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
    return stored === 'table' || stored === 'board' ? stored : 'board';
  });
  useEffect(() => {
    try { window.localStorage.setItem(TAB_STORAGE_KEY, tab); } catch { /* ignore */ }
  }, [tab]);

  function handleExport() {
    if (!activeDist) return;
    const wb = buildExportWorkbook(students, projects, activeDist.assignments);
    const date = new Date().toISOString().slice(0, 10);
    const slug = activeDist.name
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    writeFile(wb, `projektverteilung-${slug || 'verteilung'}-${date}.xlsx`);
    toast.success('Excel-Export gestartet');
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Verteilung</h1>
        <Button onClick={handleExport} disabled={!activeDist || activeDist.assignments.length === 0}>
          <Download className="size-4 mr-2" />Excel exportieren
        </Button>
      </div>
      <DistributionSelector />
      {stale && (
        <div className="border border-amber-400 bg-amber-50 text-amber-900 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm">⚠ {reason} — Verteilung ist möglicherweise nicht mehr aktuell.</span>
          <Button size="sm" variant="outline" onClick={() => navigate('/optimize')}>Neu berechnen</Button>
        </div>
      )}
      <StatsPanel />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="board">Projekte</TabsTrigger>
          <TabsTrigger value="table">Tabelle</TabsTrigger>
        </TabsList>
        <TabsContent value="board"><BoardView /></TabsContent>
        <TabsContent value="table"><TableView /></TabsContent>
      </Tabs>
    </div>
  );
}
