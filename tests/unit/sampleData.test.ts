import { describe, expect, it } from 'vitest';
import { generateSampleProjects, MAX_SAMPLE_PROJECTS } from '@/lib/sampleData';

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
