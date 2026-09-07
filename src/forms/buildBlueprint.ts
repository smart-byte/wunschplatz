import type { Project, FormBlueprint, BlueprintQuestion, BlueprintOption } from '@/types';
import { normalizeLabel } from './normalizeLabel';

export type BlueprintError =
  | { code: 'tooFewProjects'; values: { count: number } }
  | { code: 'duplicateNames'; values: { names: string }; duplicates: string[] };

export type BuildBlueprintResult =
  { ok: true; blueprint: FormBlueprint } | { ok: false; error: BlueprintError };

const GRADE_OPTIONS = ['5', '6', '7', '8', '9', '10', '11', '12', '13'];

export function buildBlueprint(
  projects: Project[],
  generatedAt: string,
  language = 'de',
): BuildBlueprintResult {
  if (projects.length < 2) {
    return {
      ok: false,
      error: { code: 'tooFewProjects', values: { count: projects.length } },
    };
  }

  const byNorm = new Map<string, string[]>();
  for (const p of projects) {
    const n = normalizeLabel(p.name);
    if (!byNorm.has(n)) byNorm.set(n, []);
    byNorm.get(n)!.push(p.name);
  }
  const duplicates = [...new Set([...byNorm.values()].filter((g) => g.length > 1).flat())];
  if (duplicates.length > 0) {
    return {
      ok: false,
      error: {
        code: 'duplicateNames',
        values: { names: duplicates.join(', ') },
        duplicates,
      },
    };
  }

  const labels = projects.map((p) => p.name);
  const projectOptions: BlueprintOption[] = projects.map((p) => ({
    projectId: p.id,
    label: p.name,
  }));

  const isEnglish = language.toLowerCase().startsWith('en');
  const identity: BlueprintQuestion[] = isEnglish
    ? [
        { key: 'firstName', title: 'First Name', type: 'short_text', required: true },
        { key: 'lastName', title: 'Last Name', type: 'short_text', required: true },
        { key: 'className', title: 'Class', type: 'short_text', required: true },
        { key: 'grade', title: 'Grade', type: 'choice', options: GRADE_OPTIONS, required: true },
      ]
    : [
        { key: 'firstName', title: 'Vorname', type: 'short_text', required: true },
        { key: 'lastName', title: 'Nachname', type: 'short_text', required: true },
        { key: 'className', title: 'Klasse', type: 'short_text', required: true },
        { key: 'grade', title: 'Jahrgang', type: 'choice', options: GRADE_OPTIONS, required: true },
      ];

  const prioritiesCount = Math.min(projects.length, 5);
  const priorities: BlueprintQuestion[] = Array.from(
    { length: prioritiesCount },
    (_, i) => i + 1,
  ).map((k) => ({
    key: `priority${k}` as BlueprintQuestion['key'],
    title: isEnglish ? `Priority ${k}` : `${k}. Wahl`,
    type: 'dropdown',
    options: labels,
    required: true,
  }));

  return {
    ok: true,
    blueprint: { prioritiesCount, identity, priorities, projectOptions, generatedAt },
  };
}
