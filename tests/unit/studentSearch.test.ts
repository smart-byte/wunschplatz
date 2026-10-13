import { describe, expect, it } from 'vitest';
import { filterStudents, matchesStudent } from '@/lib/studentSearch';
import type { Student } from '@/types';

const anna: Student = {
  id: 'a',
  firstName: 'Anna',
  lastName: 'Müller',
  className: '7a',
  grade: 7,
  priorities: ['p1'],
};
const ben: Student = {
  id: 'b',
  firstName: 'Ben',
  lastName: 'Öztürk',
  className: '8c',
  grade: 8,
  priorities: [],
  groupId: 'g1',
};

describe('matchesStudent', () => {
  it.each([
    ['', true],
    ['anna', true],
    ['müller anna', true],
    ['7A', true],
    ['anna 7b', false],
    ['mul', true],
    ['schmidt', false],
  ])('query %j → %s', (query, expected) => {
    expect(matchesStudent(anna, query)).toBe(expected);
  });

  it('ignores accents in the name', () => {
    expect(matchesStudent(ben, 'ozturk')).toBe(true);
  });

  it('treats ß and ss alike', () => {
    expect(matchesStudent({ ...anna, lastName: 'Strauß' }, 'strauss')).toBe(true);
    expect(matchesStudent({ ...anna, lastName: 'Strauss' }, 'strauß')).toBe(true);
  });
});

describe('filterStudents', () => {
  it('keeps students without wishes', () => {
    expect(filterStudents([anna, ben], '', 'noWishes')).toEqual([ben]);
  });

  it('keeps grouped students', () => {
    expect(filterStudents([anna, ben], '', 'grouped')).toEqual([ben]);
  });

  it('combines the filter with the search', () => {
    expect(filterStudents([anna, ben], 'anna', 'all')).toEqual([anna]);
    expect(filterStudents([anna, ben], 'anna', 'grouped')).toEqual([]);
  });
});
