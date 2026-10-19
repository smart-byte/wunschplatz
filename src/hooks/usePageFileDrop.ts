import { useEffect, useRef, useState } from 'react';

const DEFAULT_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

export function usePageFileDrop(
  onFile: (file: File) => void,
  accept: string[] = DEFAULT_EXTENSIONS,
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
