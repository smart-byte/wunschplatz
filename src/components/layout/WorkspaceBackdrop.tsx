import './workspace-backdrop.css';

type Props = {
  page: 'projects' | 'students';
  state: 'empty' | 'filled';
};

export function WorkspaceBackdrop({ page, state }: Props) {
  return (
    <div aria-hidden="true" className="workspace-backdrop" data-page={page} data-state={state}>
      <div className="workspace-scene" />
    </div>
  );
}
