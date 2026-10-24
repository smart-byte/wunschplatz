import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { SolverConfigForm } from '@/components/optimize/SolverConfigForm';
import { useSolver } from '@/hooks/useSolver';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useProjectsStore } from '@/store/useProjectsStore';
import { toast } from 'sonner';

export default function OptimizePage() {
  const { t } = useTranslation('app');
  const navigate = useNavigate();
  const { running, progress, error, run } = useSolver();
  const studentCount = useStudentsStore((s) => s.students.length);
  const projects = useProjectsStore((s) => s.projects);
  const capacity = projects.reduce((sum, project) => sum + project.maxCapacity, 0);
  const ready = studentCount > 0 && projects.length > 0;

  async function handleRun() {
    const succeeded = await run();
    if (!succeeded) return;
    toast.success(t('optimize.computed'));
    navigate('/distribution');
  }

  return (
    <>
      <PageHeader title={t('optimize.title')} description={t('optimize.description')} />
      <div className="grid max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <fieldset disabled={running} className="min-w-0 disabled:opacity-60">
          <legend className="sr-only">{t('optimize.settings')}</legend>
          <SolverConfigForm disabled={running} />
        </fieldset>
        <aside className="overflow-hidden rounded-lg border border-rule bg-white lg:sticky lg:top-36">
          <div aria-hidden className="h-0.5 bg-gradient-to-r from-mark to-mark-2" />
          <div className="p-6">
            <p className="section-label">{t('optimize.overview')}</p>
            <h2 className="mt-3 font-serif text-2xl">
              {t(ready ? 'optimize.readyHeading' : 'optimize.prepareHeading')}
            </h2>
            <dl className="my-6 divide-y divide-rule-soft">
              {[
                ['students', studentCount],
                ['projects', projects.length],
                ['capacity', capacity],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                  <dt className="text-prose-soft">{t(`optimize.counts.${label}`)}</dt>
                  <dd className="font-medium tabular-nums text-mark-ink">{value}</dd>
                </div>
              ))}
            </dl>
            {!ready ? (
              <div className="mb-5 space-y-2 text-sm leading-relaxed text-prose-soft">
                <p>{t('optimize.missingData')}</p>
                {projects.length === 0 && (
                  <Link className="block text-mark underline underline-offset-4" to="/projects">
                    {t('distribution.empty.goToProjects')} →
                  </Link>
                )}
                {studentCount === 0 && (
                  <Link className="block text-mark underline underline-offset-4" to="/students">
                    {t('distribution.empty.goToStudents')} →
                  </Link>
                )}
              </div>
            ) : capacity < studentCount ? (
              <p className="mb-5 text-sm leading-relaxed text-amber-800">
                {t('optimize.capacityHint', { count: studentCount - capacity })}
              </p>
            ) : null}
            <Button
              size="lg"
              className="w-full px-4"
              disabled={running || !ready}
              onClick={handleRun}
            >
              {running ? (
                <LoaderCircle className="animate-spin motion-reduce:animate-none" />
              ) : null}
              {running ? t('optimize.running') : t('optimize.run')}
              {!running && <ArrowRight />}
            </Button>
            {running && (
              <div className="mt-4">
                <div
                  role="progressbar"
                  aria-label={t('optimize.running')}
                  aria-valuenow={progress}
                  className="h-1.5 overflow-hidden rounded-full bg-rule-soft"
                >
                  <div className="h-full bg-mark" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs tabular-nums text-prose-soft">
                  {t('optimize.progress', { percent: progress })}
                </p>
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-prose-soft">
              {t('optimize.savedSeparately')}
            </p>
            {error && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            )}
            {running && (
              <p role="status" className="sr-only">
                {t('optimize.running')}
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
