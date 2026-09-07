import { describe, expect, it } from 'vitest';
import { buildBlueprint } from '@/forms/buildBlueprint';
import { buildFormGeneratorPrompt } from '@/forms/buildFormGeneratorPrompt';
import type { Project } from '@/types';

const projects: Project[] = [
  {
    id: 'p1',
    name: 'Schach',
    description: 'Strategie und Turnier',
    grades: [7, 8],
    maxCapacity: 12,
    targetCapacity: 10,
  },
  { id: 'p2', name: 'Theater', grades: [7], maxCapacity: 14, targetCapacity: 12 },
];

function blueprint(language = 'de') {
  const result = buildBlueprint(projects, '2026-08-13T00:00:00Z', language);
  if (!result.ok) throw new Error(result.error.code);
  return result.blueprint;
}

describe('buildFormGeneratorPrompt', () => {
  it('builds an import-compatible German prompt from round and project configuration', () => {
    const prompt = buildFormGeneratorPrompt({
      blueprint: blueprint(),
      projects,
      roundName: 'Sommer 2026',
      language: 'de-DE',
    });

    expect(prompt).toContain('Projektwahl – Sommer 2026');
    expect(prompt).toContain('2 priorisierten Projektwünsche');
    expect(prompt).toContain('"Vorname" — Kurzantwort');
    expect(prompt).toContain('"1. Wahl" — Drop-down');
    expect(prompt).toContain('Schach — Jahrgänge: 7, 8; Beschreibung: Strategie und Turnier');
  });

  it('builds an English prompt and preserves exact blueprint labels', () => {
    const prompt = buildFormGeneratorPrompt({
      blueprint: blueprint('en'),
      projects,
      roundName: 'Summer 2026',
      language: 'en',
    });

    expect(prompt).toContain('Project choices – Summer 2026');
    expect(prompt).toContain('"Last Name" — Short answer');
    expect(prompt).toContain('"Priority 1" — Dropdown');
    expect(prompt).toContain('Preserve every question title and option verbatim');
    expect(prompt).toContain('   - Theater');
  });
});
