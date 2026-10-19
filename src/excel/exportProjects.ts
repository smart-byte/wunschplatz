import { utils } from 'xlsx';
import type { WorkBook } from 'xlsx';
import type { Project } from '@/types';
import { formatGrades } from '@/lib/utils';

export function buildProjectsWorkbook(projects: Project[], language = 'de'): WorkBook {
  const english = language.toLowerCase().startsWith('en');
  const labels = english
    ? {
        name: 'Name',
        description: 'Description',
        grades: 'Grades',
        max: 'Maximum',
        target: 'Target',
      }
    : {
        name: 'Name',
        description: 'Beschreibung',
        grades: 'Jahrgänge',
        max: 'Max',
        target: 'Soll',
      };
  const rows = projects.map((p) => ({
    [labels.name]: p.name,
    [labels.description]: p.description ?? '',
    [labels.grades]: formatGrades(p.grades),
    [labels.max]: p.maxCapacity,
    [labels.target]: p.targetCapacity,
  }));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, utils.json_to_sheet(rows), english ? 'Projects' : 'Projekte');
  return wb;
}
