import { useEffect, useRef, useState } from 'react';

/**
 * Listen for file drag-and-drop on the whole document. Calls `onFile` with the
 * first dropped file matching the accepted extensions. Returns `isDragging`
 * which flips to true while a file is being dragged over the page.
 */
export function usePageFileDrop(
  onFile: (file: File) => void,
  accept: string[] = ['.xlsx', '.xls', '.csv'],
) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    function matches(file: File): boolean {
      const name = file.name.toLowerCase();
      return accept.some((ext) => name.endsWith(ext.toLowerCase()));
    }

    function onDragEnter(e: DragEvent) {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
      dragCounter.current += 1;
      setIsDragging(true);
    }
    function onDragOver(e: DragEvent) {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
    }
    function onDragLeave(e: DragEvent) {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    }
    function onDrop(e: DragEvent) {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && matches(file)) {
        onFile(file);
      }
    }

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [onFile, accept]);

  return { isDragging };
}
