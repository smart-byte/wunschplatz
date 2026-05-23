import { v4 as uuid } from 'uuid';
import type { Project, Student } from '@/types';

type ProjectTemplate = {
  name: string;
  description: string;
  grades: number[];
  maxCapacity: number;
  targetCapacity: number;
};

const PROJECT_POOL: ProjectTemplate[] = [
  { name: 'Schulgarten gestalten', description: 'Beete anlegen, Kräuter und Gemüse pflanzen, Komposthaufen aufbauen.', grades: [5, 6, 7, 8, 9], maxCapacity: 18, targetCapacity: 15 },
  { name: 'Theater-AG: Romeo und Julia', description: 'Klassiker neu inszeniert. Bühnenbau, Kostüme, Proben.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 20, targetCapacity: 16 },
  { name: 'Programmieren mit Python', description: 'Spielprogrammierung, kleine Apps und Pixelkunst-Animationen.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 12 },
  { name: 'Roboter mit Lego Mindstorms', description: 'Sensoren und Motoren programmieren, Wettbewerb am letzten Tag.', grades: [5, 6, 7, 8], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Schülerzeitung produzieren', description: 'Recherche, Interviews, Layout und Druck einer eigenen Ausgabe.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 15, targetCapacity: 12 },
  { name: 'Töpfern und Keramik', description: 'Schalen, Tassen und freie Skulpturen am Brennofen.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 14 },
  { name: 'Improvisationstheater', description: 'Spontan auf der Bühne, kein Skript, viel Spaß.', grades: [7, 8, 9, 10, 11, 12], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Yoga und Achtsamkeit', description: 'Asanas, Atemübungen und tägliche Meditation.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 20, targetCapacity: 16 },
  { name: 'Fotografie: Lichtwerkstatt', description: 'Schwarzweißfotografie mit Dunkelkammer-Entwicklung.', grades: [9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Kochen aus aller Welt', description: 'Pizza, Sushi, Curry — jeden Tag eine andere Küche.', grades: [5, 6, 7, 8, 9, 10], maxCapacity: 16, targetCapacity: 14 },
  { name: 'Skateboard-Workshop', description: 'Basics, Tricks lernen, gemeinsam Rampen bauen.', grades: [7, 8, 9, 10, 11, 12], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Schulband', description: 'Instrumente mitbringen, gemeinsam Songs für das Schulfest einüben.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Brettspiele entwerfen', description: 'Eigene Spiele entwickeln, testen, Prototypen bauen.', grades: [5, 6, 7, 8, 9], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Wald-Exkursion: Bäume und Vögel', description: 'Tägliche Wanderungen, Vogelbestimmung, Tierspuren lesen.', grades: [5, 6, 7, 8], maxCapacity: 16, targetCapacity: 14 },
  { name: 'DIY Möbel aus Paletten', description: 'Hochbeet, Sitzbank, Tisch — alles selbst gebaut.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Mathe-Knobelei und Logikrätsel', description: 'Olympiade-Aufgaben, Sudoku, Kombinatorik.', grades: [6, 7, 8, 9, 10], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Filmemachen: Kurzfilm-Workshop', description: 'Drehbuch, Kameraführung, Schnitt am Mac.', grades: [9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Klettern und Outdoor-Sport', description: 'Kletterhalle, Bouldern, Orientierungslauf im Wald.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 14 },
  { name: 'Origami-Werkstatt', description: 'Vom einfachen Kranich bis zum komplexen Drachen.', grades: [5, 6, 7], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Schach-Akademie', description: 'Eröffnungen, Mittelspiel, Endspielstrategien — mit Turnier.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Comic zeichnen', description: 'Eigene Heldengeschichten, Manga-Stil oder klassisch.', grades: [5, 6, 7, 8, 9, 10], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Astronomie und Sterngucken', description: 'Planeten, Sternbilder, abends gemeinsam ans Teleskop.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Erste Hilfe und Rettungstechniken', description: 'Verbände, Wiederbelebung, Notfälle realistisch simulieren.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 14 },
  { name: 'Imkerei: Bienen im Schulgarten', description: 'Bienenstock öffnen, Waben begutachten, Honig schleudern.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 10, targetCapacity: 8 },
  { name: 'Rap und Beatproduktion', description: 'Reime schreiben, Beats am Laptop bauen, Recording im Studio.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Nähen und Kleidung designen', description: 'Eigene Shirts, Taschen, Upcycling alter Kleidung.', grades: [6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: '3D-Druck und CAD', description: 'Konstruktion am Computer, Druck vor Ort, eigene Modelle.', grades: [9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
];

const FIRST_NAMES = [
  // f
  'Anna', 'Carla', 'Emma', 'Greta', 'Ida', 'Klara', 'Mia', 'Olivia', 'Romy', 'Tilda',
  'Vera', 'Yara', 'Zoe', 'Lara', 'Sophie', 'Lea', 'Lisa', 'Mila', 'Lena', 'Marie',
  'Hanna', 'Jule', 'Frieda', 'Lina', 'Alma', 'Helena', 'Mathilda', 'Ronja', 'Lotte', 'Pia',
  'Nele', 'Amelie', 'Lilly', 'Leni', 'Ella', 'Ida', 'Charlotte', 'Johanna', 'Paula', 'Luisa',
  'Antonia', 'Clara', 'Elena', 'Emilia', 'Jana', 'Juna', 'Katharina', 'Laura', 'Magdalena', 'Maja',
  'Mara', 'Mariella', 'Mathea', 'Melina', 'Merle', 'Mira', 'Nora', 'Pauline', 'Rosa', 'Selma',
  'Sina', 'Smilla', 'Stella', 'Sunna', 'Tessa', 'Thea', 'Valentina', 'Viktoria', 'Aaliyah', 'Aylin',
  'Esma', 'Fatima', 'Hira', 'Layla', 'Leyla', 'Maryam', 'Nisa', 'Sara', 'Sila', 'Zeynep',
  'Wiebke', 'Xenia', 'Birte', 'Britta', 'Doreen', 'Edda', 'Elfi', 'Henrike', 'Sophia',
  // m
  'Ben', 'David', 'Felix', 'Henry', 'Jonas', 'Leon', 'Noah', 'Paul', 'Simon', 'Lukas',
  'Max', 'Tim', 'Jan', 'Tom', 'Hannes', 'Finn', 'Luca', 'Mats', 'Theo', 'Niklas',
  'Linus', 'Oscar', 'Erik', 'Levi', 'Bruno', 'Karl', 'Anton', 'Joris', 'Alexander', 'Anton',
  'Bastian', 'Benjamin', 'Carl', 'Cornelius', 'Daniel', 'Dennis', 'Dominik', 'Elias', 'Emil', 'Fabian',
  'Florian', 'Gabriel', 'Henri', 'Jakob', 'Jaron', 'Jasper', 'Johann', 'Jonathan', 'Julius', 'Konrad',
  'Lennard', 'Leonard', 'Linus', 'Louis', 'Maximilian', 'Mika', 'Milan', 'Moritz', 'Nils', 'Oskar',
  'Phil', 'Philipp', 'Quentin', 'Raphael', 'Robin', 'Samuel', 'Sebastian', 'Severin', 'Thilo', 'Tobias',
  'Valentin', 'Vincent', 'Wim', 'Xaver', 'Yannick', 'Yusuf', 'Ahmed', 'Ali', 'Amir', 'Aram',
  'Eren', 'Hakan', 'Kerim', 'Mehmet', 'Mustafa', 'Omar', 'Samir', 'Tarek',
];

const LAST_NAMES = [
  // Top 50 deutsche Nachnamen
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker',
  'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf',
  'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann',
  'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier',
  'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'König', 'Walter',
  'Mayer', 'Huber', 'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Möller',
  'Weiß', 'Jung', 'Hahn', 'Schubert',
  // weitere häufige
  'Vogel', 'Friedrich', 'Keller', 'Günther', 'Frank', 'Berger', 'Winkler', 'Roth',
  'Beck', 'Lorenz', 'Baumann', 'Franke', 'Albrecht', 'Schuster', 'Simon', 'Ludwig',
  'Böhm', 'Winter', 'Kraus', 'Martin', 'Schumacher', 'Krämer', 'Vogt', 'Stein',
  'Jäger', 'Otto', 'Sommer', 'Groß', 'Seidel', 'Heinrich', 'Brandt', 'Haas',
  'Schreiber', 'Graf', 'Schulte', 'Dietrich', 'Ziegler', 'Kuhn', 'Kühn', 'Pohl',
  'Engel', 'Horn', 'Busch', 'Bergmann', 'Thomas', 'Voigt', 'Sauer', 'Arnold',
  'Wolff', 'Pfeiffer', 'Stahl', 'Reuter', 'Adler', 'Linke', 'Beyer', 'Ebert',
  'Bach', 'Voß', 'Lindner', 'Brunner', 'Heinz', 'Rieger',
  // migrantische Häufige in DE
  'Yilmaz', 'Demir', 'Kaya', 'Öztürk', 'Aydin', 'Polat', 'Nguyen', 'Tran', 'Le', 'Pham',
];

// Realistic grade distribution: more students in lower grades (typical school)
const GRADE_DISTRIBUTION = [
  5, 5, 5, 5, 5,
  6, 6, 6, 6, 6,
  7, 7, 7, 7, 7,
  8, 8, 8, 8,
  9, 9, 9, 9,
  10, 10, 10,
  11, 11,
  12, 12,
  13,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function classForGrade(grade: number): string {
  if (grade >= 11) return String(grade);
  const letter = pick(['a', 'b', 'c']);
  return `${grade}${letter}`;
}

export const MAX_SAMPLE_PROJECTS = PROJECT_POOL.length;

export function generateSampleProjects(count: number): Project[] {
  const n = Math.max(1, Math.min(count, PROJECT_POOL.length));
  return shuffle(PROJECT_POOL).slice(0, n).map((p) => ({
    id: uuid(),
    name: p.name,
    description: p.description,
    grades: [...p.grades],
    maxCapacity: p.maxCapacity,
    targetCapacity: p.targetCapacity,
  }));
}

export function generateSampleStudents(count: number, projects: Project[]): Student[] {
  const students: Student[] = [];
  for (let i = 0; i < count; i++) {
    const grade = pick(GRADE_DISTRIBUTION);
    const compatible = projects.filter((p) => p.grades.includes(grade));
    const priorities = shuffle(compatible).slice(0, Math.min(5, compatible.length)).map((p) => p.id);
    students.push({
      id: uuid(),
      firstName: pick(FIRST_NAMES),
      lastName: pick(LAST_NAMES),
      className: classForGrade(grade),
      grade,
      priorities,
    });
  }
  return students;
}
