import { toast } from 'sonner';
import i18n from '@/i18n';
import { isChunkLoadError } from './chunkLoadError';

/** Shows `message`, or a reload prompt when the failure came from a missing app file. */
export function toastFailure(error: unknown, message: string): void {
  if (!isChunkLoadError(error)) {
    toast.error(message);
    return;
  }
  toast.error(i18n.t('app:common.chunkLoadFailed'), {
    action: { label: i18n.t('app:common.reload'), onClick: () => window.location.reload() },
  });
}
