# Projektverteilung

Offline-fähige Webapp zur optimalen Verteilung von Schülern auf jahrgangsgebundene Projekte mit begrenzter Kapazität, basierend auf Top-5-Prioritäten.

## Features

- Verwaltung von Projekten (Name, Jahrgänge, Max- & Soll-Kapazität)
- Excel-Import von Schülerangaben (Vorname, Nachname, Klasse, Jahrgang, Prio1-5)
- Min-Cost-Flow-basierte Optimierung mit konfigurierbaren Gewichtungen
- Tabellen- und Drag-&-Drop-Ansicht zur Review & Korrektur
- Excel-Export der finalen Verteilung
- Komplett offline (IndexedDB-Persistenz)

## Setup

```bash
npm install
npm run dev
```

Öffnet auf http://localhost:5173.

## Skripte

- `npm run dev` — Dev-Server
- `npm run build` — Produktions-Build
- `npm test` — Unit-Tests (Vitest)
- `npm run test:e2e` — E2E-Tests (Playwright)
- `npm run typecheck` — TypeScript-Check

## Workflow

1. **Projekte** anlegen (Jahrgänge, Max- und Soll-Kapazität)
2. **Schüler** als Excel importieren (Spalten: Vorname, Nachname, Klasse, Jahrgang, Prio1-5)
3. **Optimierung** starten (Gewichtungen optional anpassen)
4. **Verteilung** review/korrigieren (Tabelle oder Board), exportieren

## Stack

React 18, TypeScript, Vite, Tailwind, shadcn/ui, Zustand, IndexedDB (via idb-keyval), xlsx, @dnd-kit, Web Workers.

## Persistenz

Alle Daten (Projekte, Schüler, Verteilung) werden im Browser via IndexedDB gespeichert. Kein Server. Browser-Daten löschen = Reset.

## Excel-Format

Spalten (case-insensitiv, Reihenfolge egal):
- `Vorname` / `Nachname` / `Klasse` (z.B. "7a") / `Jahrgang` (Zahl 5-13)
- `Prio1` bis `Prio5` (Projekt-Namen, müssen mit angelegten Projekten übereinstimmen)

Englische Spalten ebenfalls erkannt: `First Name`, `Last Name`, `Class`, `Grade`, `Priority 1-5`.
