import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { setActiveRoundBlueprint } from '@/store/roundsTransaction';
import { buildBlueprint } from '@/forms/buildBlueprint';
import { buildFormGeneratorPrompt } from '@/forms/buildFormGeneratorPrompt';
import type { BlueprintQuestion, FormBlueprint, Project } from '@/types';

export function BlueprintPanel() {
  const { t } = useTranslation('app');
  const projects = useProjectsStore((s) => s.projects);
  const activeRoundId = useRoundsStore((s) => s.activeRoundId);
  const activeRound = useRoundsStore((s) => s.rounds.find((r) => r.id === s.activeRoundId));
  const blueprint = activeRound?.blueprint;
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!blueprint);
  const hasEnoughProjects = projects.length >= 2;

  function onGenerate() {
    if (blueprint && !confirm(t('blueprint.regenerateConfirm'))) return;
    const res = buildBlueprint(projects, new Date().toISOString());
    if (!res.ok) {
      const message = t(`blueprint.errors.${res.error.code}`, res.error.values);
      setError(message);
      toast.error(message);
      return;
    }
    setError(null);
    setActiveRoundBlueprint(res.blueprint);
    setExpanded(true);
    toast.success(t('blueprint.created'));
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-medium">{t('blueprint.heading')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('blueprint.description', { count: projects.length })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button onClick={onGenerate} disabled={!activeRoundId || !hasEnoughProjects}>
            {blueprint ? t('blueprint.regenerate') : t('blueprint.generate')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls="form-template-content"
            title={t(expanded ? 'blueprint.collapse' : 'blueprint.expand')}
          >
            <ChevronDown
              className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
            <span className="sr-only">
              {t(expanded ? 'blueprint.collapse' : 'blueprint.expand')}
            </span>
          </Button>
        </div>
      </div>

      {expanded && (
        <div id="form-template-content" className="space-y-3">
          {!hasEnoughProjects && (
            <p className="text-sm text-muted-foreground">
              {t('blueprint.minimumProjects', { count: projects.length })}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {blueprint && (
            <BlueprintView
              blueprint={blueprint}
              projects={projects}
              roundName={activeRound?.name ?? t('rounds.title')}
            />
          )}
        </div>
      )}
    </div>
  );
}

function BlueprintView({
  blueprint,
  projects,
  roundName,
}: {
  blueprint: FormBlueprint;
  projects: Project[];
  roundName: string;
}) {
  const { t } = useTranslation('app');
  const optionsText = useMemo(
    () => blueprint.priorities[0]?.options?.join('\n') ?? '',
    [blueprint],
  );
  const generatorPrompt = useMemo(
    () => buildFormGeneratorPrompt({ blueprint, projects, roundName }),
    [blueprint, projects, roundName],
  );
  const allQuestions = [...blueprint.identity, ...blueprint.priorities];
  const [copied, setCopied] = useState<'prompt' | 'options' | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  function copy(text: string, target: 'prompt' | 'options') {
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopied(target);
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(null), 2_000);
        toast.success(t('blueprint.copied'));
      },
      () => toast.error(t('blueprint.copyFailed')),
    );
  }

  function questionTypeLabel(q: BlueprintQuestion) {
    return q.type === 'dropdown'
      ? t('blueprint.questionType.dropdown')
      : q.type === 'choice'
        ? t('blueprint.questionType.choice')
        : t('blueprint.questionType.text');
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="google">
        <TabsList>
          <TabsTrigger value="google">{t('blueprint.tabs.google')}</TabsTrigger>
          <TabsTrigger value="microsoft">{t('blueprint.tabs.microsoft')}</TabsTrigger>
        </TabsList>
        <TabsContent value="google" className="text-sm text-muted-foreground space-y-3">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <a
                href="https://forms.google.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2 hover:no-underline"
              >
                forms.google.com
              </a>
              {' → '}
              {t('blueprint.google.step1')}
            </li>
            <li>{t('blueprint.google.step2')}</li>
            <li>{t('blueprint.google.step3')}</li>
            <li>{t('blueprint.google.step4')}</li>
            <li>{t('blueprint.google.step5')}</li>
          </ol>
          <details className="group rounded-lg border bg-muted/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 [&::-webkit-details-marker]:hidden">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-foreground">
                    {t('blueprint.google.promptHeading')}
                  </h3>
                  <span className="rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t('blueprint.google.optionalPreview')}
                  </span>
                </div>
                <p className="text-xs mt-0.5">{t('blueprint.google.promptDescription')}</p>
              </div>
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-2 border-t p-3">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => copy(generatorPrompt, 'prompt')}
                  aria-live="polite"
                >
                  {copied === 'prompt' ? (
                    <Check className="size-4 mr-2 text-green-600" />
                  ) : (
                    <Copy className="size-4 mr-2" />
                  )}
                  {copied === 'prompt' ? t('blueprint.copied') : t('blueprint.google.copyPrompt')}
                </Button>
              </div>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded border bg-background p-3 text-xs text-foreground">
                {generatorPrompt}
              </pre>
            </div>
          </details>
        </TabsContent>
        <TabsContent value="microsoft" className="text-sm text-muted-foreground space-y-1">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <a
                href="https://forms.office.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2 hover:no-underline"
              >
                forms.office.com
              </a>
              {' → '}
              {t('blueprint.microsoft.step1')}
            </li>
            <li>{t('blueprint.microsoft.step2')}</li>
            <li>{t('blueprint.microsoft.step3')}</li>
            <li>{t('blueprint.microsoft.step4')}</li>
          </ol>
        </TabsContent>
      </Tabs>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{t('blueprint.optionsLabel')}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(optionsText, 'options')}
            aria-live="polite"
          >
            {copied === 'options' ? (
              <Check className="size-4 mr-2 text-green-600" />
            ) : (
              <Copy className="size-4 mr-2" />
            )}
            {copied === 'options' ? t('blueprint.copied') : t('blueprint.copyOptions')}
          </Button>
        </div>
        <pre className="rounded border bg-muted/30 p-2 text-xs overflow-x-auto whitespace-pre-wrap">
          {optionsText}
        </pre>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">
          {t('blueprint.questionsCount', { count: allQuestions.length })}
        </span>
        <ul className="space-y-1">
          {allQuestions.map((q) => (
            <li
              key={q.key}
              className="flex flex-wrap items-center justify-between gap-2 rounded border px-2 py-1 text-sm"
            >
              <span>{q.title}</span>
              <span className="text-xs text-muted-foreground">
                {questionTypeLabel(q)}
                {q.required ? t('blueprint.required') : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
