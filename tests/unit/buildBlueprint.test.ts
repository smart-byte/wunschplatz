import { describe, it, expect } from 'vitest';
import { buildBlueprint } from '@/forms/buildBlueprint';
import type { Project } from '@/types';

const mk = (n: number): Project[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `Projekt ${i}`,
    grades: [7],
    maxCapacity: 10,
    targetCapacity: 8,
  }));

describe('buildBlueprint', () => {
  it('blocks with fewer than 2 projects', () => {
    for (const n of [0, 1]) {
      const r = buildBlueprint(mk(n), '2026-06-02T00:00:00Z');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('tooFewProjects');
    }
  });

  it('creates one distinct choice per project for rounds with 2-4 projects', () => {
    for (const n of [2, 3, 4]) {
      const r = buildBlueprint(mk(n), '2026-06-02T00:00:00Z');
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.blueprint.prioritiesCount).toBe(n);
      expect(r.blueprint.priorities).toHaveLength(n);
    }
  });

  it('blocks on duplicate normalized names', () => {
    const projects: Project[] = [
      { id: 'a', name: 'Yoga', grades: [7], maxCapacity: 10, targetCapacity: 8 },
      { id: 'b', name: ' yoga ', grades: [7], maxCapacity: 10, targetCapacity: 8 },
      ...mk(3).map((p, i) => ({ ...p, id: `x${i}`, name: `Andere ${i}` })),
    ];
    const r = buildBlueprint(projects, '2026-06-02T00:00:00Z');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('duplicateNames');
  });

  it('produces 4 identity + 5 dropdown questions and {projectId,label} options', () => {
    const projects = mk(5);
    const r = buildBlueprint(projects, '2026-06-02T00:00:00Z');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const bp = r.blueprint;
    expect(bp.prioritiesCount).toBe(5);
    expect(bp.identity.map((q) => q.title)).toEqual(['Vorname', 'Nachname', 'Klasse', 'Jahrgang']);
    expect(bp.priorities.map((q) => q.title)).toEqual([
      '1. Wahl',
      '2. Wahl',
      '3. Wahl',
      '4. Wahl',
      '5. Wahl',
    ]);
    expect(bp.priorities[0].options).toEqual(projects.map((p) => p.name));
    expect(bp.projectOptions).toEqual(projects.map((p) => ({ projectId: p.id, label: p.name })));
    expect(bp.generatedAt).toBe('2026-06-02T00:00:00Z');
  });

  it('uses English question titles when an English template is requested', () => {
    const r = buildBlueprint(mk(2), '2026-06-02T00:00:00Z', 'en-US');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.blueprint.identity.map((q) => q.title)).toEqual([
      'First Name',
      'Last Name',
      'Class',
      'Grade',
    ]);
    expect(r.blueprint.priorities.map((q) => q.title)).toEqual(['Priority 1', 'Priority 2']);
  });
});
