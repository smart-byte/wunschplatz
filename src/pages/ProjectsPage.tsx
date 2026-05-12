import { Button } from '@/components/ui/button';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { useProjectsStore } from '@/store/useProjectsStore';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function ProjectsPage() {
  const addProject = useProjectsStore((s) => s.addProject);
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projekte</h1>
        <ProjectFormDialog
          trigger={<Button><Plus className="size-4 mr-2" />Neues Projekt</Button>}
          onSave={(data) => {
            addProject(data);
            toast.success(`Projekt "${data.name}" angelegt`);
          }}
        />
      </div>
      <ProjectsTable />
    </div>
  );
}
