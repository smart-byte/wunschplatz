# Wunschplatz

Wunschplatz hilft Schulen, Schüler anhand ihrer Projektwünsche, Jahrgänge und verfügbarer Plätze zu verteilen. Die App ist auf Deutsch und Englisch verfügbar. Importierte Daten und Berechnungen bleiben im Browser.

Online nutzbar unter [wunschplatz.app](https://wunschplatz.app).

## Lokal starten

Voraussetzung: Node.js 22.13 oder neuer innerhalb der 22er-Reihe, oder Node.js 24+.

```sh
npm ci
npm run dev
```

Die App läuft unter http://localhost:5173. `npm run build` erstellt `dist/`; `npm run preview` zeigt den Produktions-Build.

## Ablauf

1. **Wunschrunde auswählen, anlegen oder umbenennen.** Jede Runde besitzt eigene Projekte, Schüler, Formularvorlagen, Einstellungen und Verteilungen. „Geplant“, „Laufend“ und „Abgeschlossen“ sind organisatorische Labels; abgeschlossene Runden bleiben bearbeitbar.
2. **Projekte erstellen oder importieren.** Namen müssen eindeutig sein. Jahrgänge sind ganze Zahlen von 5 bis 13, z. B. `5–7` oder `5, 7, 9`. Maximale Kapazität und Sollzahl sind ganze Zahlen; die Sollzahl darf die maximale Kapazität nicht überschreiten.
3. **Wünsche erfassen.** Schüler können manuell oder per Excel-/CSV-Datei importiert werden. Alternativ erzeugt die App eine Vorlage für Google Forms oder Microsoft Forms. Formularantworten anschließend exportieren und in Wunschplatz importieren. Nach Neuerstellung einer Vorlage muss beim Import die tatsächlich verwendete Version ausgewählt werden.
4. **Optimieren und prüfen.** Die Berechnung berücksichtigt Wünsche, Jahrgänge, Kapazitäten und Gruppen. Änderungen an Eingaben oder ein Rundenwechsel brechen laufende Berechnungen ab. Board und Tabelle erlauben dieselben manuellen Änderungen; Ausnahmen von Jahrgangs- und Kapazitätsregeln müssen bestätigt werden. Die Tabelle bietet die Bedienung per Tastatur.
5. **Exportieren.** Excel-Exporte und die Übersicht zeigen die aktuellen Zuordnungen und Wunschränge. Die Punktzahl und Laufdetails beschreiben die ursprüngliche Berechnung. Nach relevanten Eingabeänderungen weist die App auf eine nötige Neuberechnung hin.

## Importregeln

Excel-Schülerspalten: `Vorname`, `Nachname`, `Klasse`, `Jahrgang`, `Prio1` bis `Prio5`; optional `Gruppe`. Englische Entsprechungen wie `First Name`, `Last Name`, `Class`, `Grade` und `Priority 1` werden ebenfalls erkannt. Formularimporte verwenden die Spalten und Projekt-IDs der ausgewählten Vorlage. Bei mehrfachen Formularantworten gewinnt die letzte gültige Abschlusszeit, sonst die letzte Zeile.

CSV-Dateien müssen UTF-8 sein (mit oder ohne BOM); UTF-16 mit BOM wird ebenfalls unterstützt. Ungültige, mehrdeutige, gelöschte oder doppelte Projektwünsche blockieren den Import. Korrigiere die Datei und lade sie erneut. Unterschiedliche Gruppenwünsche werden mit einem Hinweis an das erste Gruppenmitglied angeglichen.

Beim Ersetzen von Projekten bleiben IDs bei eindeutig gleichem Namen erhalten. Werden Projekte entfernt, leert die App nach dem entsprechenden Hinweis die gesamten betroffenen Wunschlisten und löscht die Verteilungen, damit keine späteren Wünsche unbemerkt aufrücken. Ältere Formularvorlagen bleiben zur Prüfung früherer Antworten erhalten.

## Speicherung und Datenschutz

Wunschplatz speichert Daten in IndexedDB auf diesem Gerät und überträgt importierte Schülerdaten nicht an einen Server. Es gibt kein Wunschplatz-Konto und keine Cookies. Auf wunschplatz.app zählt eine eigene Umami-Instanz Seitenaufrufe ohne Cookies; Daten zu Runden, Projekten oder Schülern sind darin nicht enthalten. Details stehen in der [Datenschutzerklärung](https://wunschplatz.app/datenschutz). Google Forms und Microsoft Forms sind eigenständige externe Dienste: Dort erhobene Antworten werden beim jeweiligen Anbieter gespeichert und verarbeitet.

Mehrere Tabs und Fenster desselben Browserprofils können gleichzeitig arbeiten. Jeder Tab behält seine eigene ausgewählte Wunschrunde; gespeicherte Änderungen erscheinen auch in den anderen Tabs. Änderungen an verschiedenen Einträgen und Feldern werden zusammengeführt. Bei gleichzeitigen Änderungen desselben Feldes gilt die zuletzt gespeicherte Änderung; ein Hinweis macht auf den Konflikt aufmerksam. Gelöschte Einträge werden durch veraltete Tabs nicht wiederhergestellt. Offene Bearbeitungsformulare behalten ihre Eingaben und verlangen bei einem Konflikt eine erneute Prüfung.

Alle Runden werden gemeinsam in einer atomaren IndexedDB-Transaktion gespeichert. Bei Speicherfehlern stoppt die Bearbeitung; der vorherige vollständige Datenbestand bleibt erhalten. Daten aus älteren Versionen einschließlich unterbrochener Rundenwechsel werden beim ersten Laden übernommen.

Die App benötigt HTTPS (oder localhost) und einen aktuellen Browser mit IndexedDB. Eine Internetverbindung ist zum Öffnen oder Neuladen nötig. Es gibt keinen Service Worker für einen garantierten Offline-Neustart. Bereits geladene Ansichten können offline nutzbar bleiben; weitere Ansichten und der Rechenworker werden bei Bedarf geladen. Das Erheben von Antworten über externe Formulare benötigt ebenfalls Internet.

Browserdaten löschen, ein anderes Browserprofil oder eine andere App-Adresse verwenden bedeutet einen anderen Datenbestand. Excel-Exporte sichern die angezeigten Daten, sind aber kein vollständiges Backup aller Runden und Vorlagen.

## Entwicklung

React, TypeScript, Vite, Tailwind, Radix UI, Zustand, IndexedDB, SheetJS und ein Web Worker für die Optimierung.

```sh
npm run lint
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run format` formatiert den Quellcode. Beitragsregeln und Hinweise zur Architektur stehen in [CONTRIBUTING.md](CONTRIBUTING.md). Pull Requests werden mit Linting, Formatierung, Unit-Tests, Build und Browser-Tests geprüft.

SheetJS wird in einer festen, gepatchten Version von der [offiziellen Distribution](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/) installiert; das npm-Registry-Paket `xlsx` wird dort nicht mehr aktuell gehalten. Der Lockfile enthält die Integritätsprüfung.

## Lizenz

[ISC](LICENSE), wie in `package.json` angegeben.
