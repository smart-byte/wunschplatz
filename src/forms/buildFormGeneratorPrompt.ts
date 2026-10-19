import type { FormBlueprint, Project } from '@/types';

type GeneratorPromptInput = {
  blueprint: FormBlueprint;
  projects: Project[];
  roundName: string;
};

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

// German like the form it describes, so the generated form keeps the exact template titles.
export function buildFormGeneratorPrompt({
  blueprint,
  projects,
  roundName,
}: GeneratorPromptInput): string {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const options = blueprint.projectOptions.map((option) => option.label);
  const optionList = options.map((label) => `   - ${label}`).join('\n');

  const questions = [...blueprint.identity, ...blueprint.priorities]
    .map((question, index) => {
      const type =
        question.type === 'short_text'
          ? 'Kurzantwort'
          : question.type === 'choice'
            ? 'Auswahl'
            : 'Drop-down';
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
      return `- ${option.label} — Jahrgänge: ${grades}${description ? `; Beschreibung: ${description}` : ''}`;
    })
    .join('\n');

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
