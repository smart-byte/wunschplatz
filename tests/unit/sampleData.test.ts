import { describe, expect, it } from 'vitest';
import {
  fitSampleCapacity,
  generateSampleProjects,
  generateSampleStudents,
  MAX_SAMPLE_PROJECTS,
} from '@/lib/sampleData';
import { solveAssignments } from '@/solver/solve';
import { defaultSolverConfig } from '@/types';

describe('localized sample data', () => {
  it('provides a complete English version of every sample project', () => {
    const projects = generateSampleProjects(MAX_SAMPLE_PROJECTS, 'en');
    expect(projects).toHaveLength(MAX_SAMPLE_PROJECTS);
    expect(projects.every((project) => project.name && project.description)).toBe(true);
    expect(projects.some((project) => project.name === 'Design a School Garden')).toBe(true);
    expect(projects.some((project) => project.name === 'Schulgarten gestalten')).toBe(false);
  });

  it('keeps German sample content for German locales', () => {
    const projects = generateSampleProjects(MAX_SAMPLE_PROJECTS, 'de-DE');
    expect(projects.some((project) => project.name === 'Schulgarten gestalten')).toBe(true);
  });
});

describe('sample capacity', () => {
  // Overfilling costs more than leaving a student out, so any unseated student means no fit.
  const config = { ...defaultSolverConfig, overTargetPenalty: 100_000 };

  it.each([
    [1, 300],
    [3, 200],
    [10, 200],
    [15, 120],
  ])('%i projects seat %i students within their target sizes', (projectCount, studentCount) => {
    const sample = generateSampleProjects(projectCount);
    const students = generateSampleStudents(studentCount, sample);
    const projects = fitSampleCapacity(sample, students);
    const { assignments } = solveAssignments(students, projects, config);
    expect(assignments.filter((a) => a.projectId === null)).toEqual([]);
    for (const project of projects) {
      const load = assignments.filter((a) => a.projectId === project.id).length;
      expect(load).toBeLessThanOrEqual(project.targetCapacity);
    }
    expect(projects.reduce((sum, p) => sum + p.targetCapacity, 0)).toBeGreaterThanOrEqual(
      studentCount * 1.1,
    );
  });
});
