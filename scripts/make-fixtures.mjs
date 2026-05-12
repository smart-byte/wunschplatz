import { utils, writeFile } from 'xlsx';
import { mkdirSync } from 'node:fs';

mkdirSync('tests/e2e/fixtures', { recursive: true });

const wb = utils.book_new();
const data = [
  ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2', 'Prio3', 'Prio4', 'Prio5'],
  ['Anna', 'Müller', '7a', 7, 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
  ['Ben', 'Schmidt', '7b', 7, 'Beta', 'Alpha', 'Gamma', 'Delta', 'Epsilon'],
  ['Carla', 'Weber', '7a', 7, 'Gamma', 'Alpha', 'Beta', 'Delta', 'Epsilon'],
];
const ws = utils.aoa_to_sheet(data);
utils.book_append_sheet(wb, ws, 'Schüler');
writeFile(wb, 'tests/e2e/fixtures/students.xlsx');
console.log('Fixture written.');
