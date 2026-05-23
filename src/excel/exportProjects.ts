import { utils } from 'xlsx';
import type { WorkBook } from 'xlsx';
import type { Project } from '@/types';
import { formatGrades } from '@/lib/utils';

/**
 * Build a workbook with one sheet containing all projects. Columns match
 * what the project importer expects so export → import is a round-trip.
 */
export function buildProjectsWorkbook(projects: Project[]): WorkBook {
  const rows = projects.map((p) => ({
    Name: p.name,
    Beschreibung: p.description ?? '',
    Jahrgänge: formatGrades(p.grades),
    Max: p.maxCapacity,
    Soll: p.targetCapacity,
  }));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, utils.json_to_sheet(rows), 'Projekte');
  return wb;
}
