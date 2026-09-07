import type { FormBlueprint, Project } from '@/types';

type GeneratorPromptInput = {
  blueprint: FormBlueprint;
  projects: Project[];
  roundName: string;
  language: string;
};

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function buildFormGeneratorPrompt({
  blueprint,
  projects,
  roundName,
  language,
}: GeneratorPromptInput): string {
  const german = language.toLowerCase().startsWith('de');
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const options = blueprint.projectOptions.map((option) => option.label);
  const optionList = options.map((label) => `   - ${label}`).join('\n');

  const questions = [...blueprint.identity, ...blueprint.priorities]
    .map((question, index) => {
      const type =
        question.type === 'short_text'
          ? german
            ? 'Kurzantwort'
            : 'Short answer'
          : question.type === 'choice'
            ? german
              ? 'Auswahl'
              : 'Multiple choice'
            : german
              ? 'Drop-down'
              : 'Dropdown';
      const choices = question.key.startsWith('priority')
        ? `\n${optionList}`
        : question.options
          ? `\n${question.options.map((option) => `   - ${option}`).join('\n')}`
          : '';
      return `${index + 1}. "${question.title}" — ${type}${choices}`;
    })
    .join('\n');

  const projectContext = blueprint.projectOptions
    .map((option) => {
      const project = projectById.get(option.projectId);
      if (!project) return `- ${option.label}`;
      const grades = project.grades.join(', ');
      const description = oneLine(project.description ?? '');
      if (german) {
        return `- ${option.label} — Jahrgänge: ${grades}${description ? `; Beschreibung: ${description}` : ''}`;
      }
      return `- ${option.label} — grades: ${grades}${description ? `; description: ${description}` : ''}`;
    })
    .join('\n');

  if (german) {
    return `Erstelle ein Google-Formular für eine schulische Projektwahl.

Formulartitel: "Projektwahl – ${roundName}"

Zweck des Formulars:
Schülerinnen und Schüler geben ihre persönlichen Daten und ihre ${blueprint.prioritiesCount} priorisierten Projektwünsche ab. Erkläre in einer kurzen, freundlichen Einleitung, dass die 1. Wahl der höchste Wunsch ist und jedes Projekt höchstens einmal gewählt werden soll.

Erstelle exakt diese Pflichtfragen in dieser Reihenfolge. Übernimm alle Fragetitel und Auswahloptionen wortgetreu:
${questions}

Projektkontext für eine knappe Übersicht in der Formularbeschreibung:
${projectContext}

Wichtige Vorgaben:
- Alle Fragen sind Pflichtfragen.
- Die Projektfragen verwenden jeweils dieselbe vollständige Projektliste in derselben Reihenfolge.
- Weise deutlich darauf hin, dass kein Projekt doppelt gewählt werden soll.
- Erstelle kein Quiz, keine Punkte und keine Auswertung.
- Füge keine weiteren Fragen hinzu und ändere keinen Fragetitel.
- Halte Gestaltung und Beschreibung klar, freundlich und für Schülerinnen und Schüler leicht verständlich.`;
  }

  return `Create a Google Form for a school project-choice round.

Form title: "Project choices – ${roundName}"

Purpose of the form:
Students submit their personal details and ${blueprint.prioritiesCount} ranked project choices. Add a short, friendly introduction explaining that the first choice is their highest preference and that each project should be selected at most once.

Create exactly these required questions in this order. Preserve every question title and option verbatim:
${questions}

Project context for a concise overview in the form description:
${projectContext}

Important requirements:
- Make every question required.
- Use the same complete project list in the same order for every project-choice question.
- Clearly tell students not to select the same project more than once.
- Do not create a quiz, scoring, or answer key.
- Do not add other questions or change any question title.
- Keep the design and description clear, friendly, and easy for students to understand.`;
}
