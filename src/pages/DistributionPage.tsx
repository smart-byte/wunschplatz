import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableView } from '@/components/distribution/TableView';
import { BoardView } from '@/components/distribution/BoardView';
import { StatsPanel } from '@/components/distribution/StatsPanel';

export default function DistributionPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Verteilung</h1>
      <StatsPanel />
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Tabelle</TabsTrigger>
          <TabsTrigger value="board">Projekte</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <TableView />
        </TabsContent>
        <TabsContent value="board">
          <BoardView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
