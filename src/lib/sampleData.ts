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
  // Sport & Outdoor
  { name: 'Hip-Hop und Streetdance', description: 'Choreografien lernen und eine eigene Performance entwickeln.', grades: [6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 18, targetCapacity: 15 },
  { name: 'Salsa und Latin-Dance', description: 'Grundschritte, Drehungen und Partner-Choreografien.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 12 },
  { name: 'Fußball-Turnier', description: 'Tägliches Training, gemeinsam zum Abschlussturnier.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 22, targetCapacity: 18 },
  { name: 'Basketball-Camp', description: 'Dribbling, Wurftechnik, Spielzüge mit Streetball-Turnier.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 18, targetCapacity: 14 },
  { name: 'Tischtennis-AG', description: 'Vor- und Rückhand, Aufschlag, Rundlauf-Turnier.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Volleyball-Workshop', description: 'Pritschen, Baggern, Aufschlag — Beachvolleyball als Highlight.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 12 },
  { name: 'Selbstverteidigung', description: 'Grundtechniken, Deeskalation, Schutz im Alltag.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 12 },
  { name: 'Bouldern für Einsteiger', description: 'Erste Wege in der Kletterhalle, Sicherungstechnik, Bewegungslehre.', grades: [5, 6, 7, 8, 9], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Schwimmverein-Schnuppern', description: 'Brust, Kraul, Rückenschwimmen — auch für Wenig-Schwimmer.', grades: [5, 6, 7, 8], maxCapacity: 16, targetCapacity: 12 },
  { name: 'Trampolin und Akrobatik', description: 'Sprünge, Salti, Menschenpyramiden im sicheren Setup.', grades: [5, 6, 7, 8, 9, 10], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Parkour und Tricking', description: 'Stadt als Spielplatz — Rollen, Sprünge, fließende Bewegung.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 10 },
  { name: 'Outdoor-Survival', description: 'Feuer machen, Knoten, Unterstand bauen, Pflanzen erkennen.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Geocaching-Tour', description: 'Mit GPS Schätze suchen rund um die Schule.', grades: [5, 6, 7, 8, 9], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Mountainbike-Touren', description: 'Technik-Training und Tagestouren durchs Gelände.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Wandern und Naturerleben', description: 'Tagestouren mit Karte, Kompass und Wildkräuter-Kunde.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 18, targetCapacity: 14 },
  // Tech & Digital
  { name: 'Game Development mit Unity', description: 'Eigenes 2D-Spiel programmieren — Mechanik bis Veröffentlichung.', grades: [9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'App-Entwicklung mit Flutter', description: 'Mobile App von Idee bis Prototyp aufs Handy.', grades: [10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Web-Design mit HTML und CSS', description: 'Eigene Webseite gestalten, Layout und Responsive Design.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 12 },
  { name: 'KI: Erste Schritte', description: 'Wie funktionieren neuronale Netze? Mit kleinen Python-Experimenten.', grades: [10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Elektronik mit Arduino', description: 'LEDs, Sensoren, eigene Schaltungen löten und programmieren.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'VR und Augmented Reality', description: 'Räume und Filter selber bauen mit Smartphone und Headset.', grades: [9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Cybersecurity für Anfänger', description: 'Sichere Passwörter, Hacks verstehen, Capture-the-Flag.', grades: [9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Linux-Workshop', description: 'Terminal, Skripte, eigenes Betriebssystem aufsetzen.', grades: [10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Pixelart und Retro-Spiele', description: 'Sprites zeichnen und ein kleines 8-Bit-Spiel bauen.', grades: [6, 7, 8, 9, 10], maxCapacity: 14, targetCapacity: 12 },
  // Kunst & Design
  { name: 'Aquarellmalerei', description: 'Lasur-Techniken, Landschaften, Stillleben.', grades: [6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Acrylmalerei auf Leinwand', description: 'Abstrakt, expressiv oder fotorealistisch — du wählst.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Streetart und Graffiti', description: 'Sprühdosen-Technik, legale Wandfläche gestalten.', grades: [9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Speckstein-Skulptur', description: 'Vom rohen Block zur eigenen Figur.', grades: [6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Buchbinden und Marmorpapier', description: 'Eigene Notizbücher mit handgefärbten Vorsatzpapieren.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Kalligrafie', description: 'Schönschrift mit Feder, Tinte und ruhiger Hand.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Linoldruck und Hochdruck', description: 'Eigene Stempel schneiden und auf Stoff und Papier drucken.', grades: [6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Magazin-Layout', description: 'Eigenes Print-Magazin mit Adobe InDesign.', grades: [9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  // Sprache & Schreiben
  { name: 'Slam-Poetry', description: 'Texte schreiben, performen, Bühnenangst überwinden.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Kreatives Schreiben', description: 'Kurzgeschichten, Lyrik, Tagebuch — täglich schreiben.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Latein-Schnupperkurs', description: 'Vokabeln, erste Sätze, Mythologie der Antike.', grades: [6, 7, 8, 9], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Gebärdensprache (DGS)', description: 'Alphabet, Begrüßung, einfache Sätze in DGS.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Französisch-Konversation', description: 'Sprechen ohne Grammatikbuch — Café-Französisch.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Spanisch reisefit', description: 'Reisevokabular, Aussprache, kleine Dialoge.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Italienisch durchs Essen', description: 'Vokabular rund um Pizza, Pasta und Espresso.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Debattierclub', description: 'Argumente schmieden, Pro und Contra auf der Bühne.', grades: [9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  // Medien & Theater
  { name: 'Schulradio und Podcast', description: 'Sendungen aufnehmen, schneiden und veröffentlichen.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Hörspiel-Produktion', description: 'Vom Drehbuch über Aufnahme bis zum Sound-Design.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Stop-Motion Animation', description: 'Knetfiguren oder Lego — Bild für Bild zum Film.', grades: [6, 7, 8, 9, 10, 11, 12], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Filmclub: Klassiker entdecken', description: 'Filme schauen, diskutieren, Filmsprache verstehen.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 14 },
  { name: 'Drehbuch-Werkstatt', description: 'Dialoge, Plot, Charaktere — kurzer Eigenfilm-Entwurf.', grades: [9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Maskenbildnerei und Special FX', description: 'Wunden, Narben, Charaktere schminken.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  // Musik
  { name: 'Schulchor', description: 'Mehrstimmiges Singen, Pop bis Klassik.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 22, targetCapacity: 18 },
  { name: 'Gitarre für Einsteiger', description: 'Erste Akkorde, Lagerfeuer-Songs, eigene Lieblingssongs.', grades: [6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Schlagzeug-Workshop', description: 'Grooves, Fills, kleine Drum-Patterns.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 10, targetCapacity: 8 },
  { name: 'Songwriting', description: 'Idee, Melodie, Text — eigener Song bis Ende der Woche.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'DJing und Mixing', description: 'Plattenteller, Crossfader, eigener Mix für die Schulparty.', grades: [9, 10, 11, 12, 13], maxCapacity: 10, targetCapacity: 8 },
  // Wissenschaft & Natur
  { name: 'Chemie-Experimente', description: 'Farbreaktionen, Kristalle züchten, Knall und Rauch.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Bio-Labor: Mikroskopieren', description: 'Zellen, Mikroorganismen, DNS-Isolation aus Erdbeeren.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Physik zum Anfassen', description: 'Magnete, Optik, Elektrostatik — Experimente, kein Frontalunterricht.', grades: [6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Wetterstation bauen', description: 'Thermometer, Hygrometer, Niederschlagsmesser selbst gebaut.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Geologie und Steine', description: 'Mineralien bestimmen, Fossilien suchen, Vulkane verstehen.', grades: [6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Meeresbiologie', description: 'Korallen, Wale, Plastikproblem — Aquarienbesuch inklusive.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 14 },
  { name: 'Vogelbestimmung', description: 'Mit Fernglas und Bestimmungsbuch raus in den Park.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Insektenhotel bauen', description: 'Behausungen für Wildbienen und Marienkäfer planen und sägen.', grades: [5, 6, 7, 8, 9], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Pflanzen bestimmen', description: 'Wildkräuter erkennen, Herbarium anlegen, essbare Wildpflanzen.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Modellraketen bauen', description: 'Aerodynamik, Triebwerk, Startrampe — am Ende fliegt sie wirklich.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  // Handwerk
  { name: 'Schreinerei: Hocker bauen', description: 'Holz, Säge, Hobel — eigener Hocker zum Mitnehmen.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Schmieden in der Esse', description: 'Feuer, Hammer, Amboss — vom Stahlnagel zum Werkzeug.', grades: [9, 10, 11, 12, 13], maxCapacity: 8, targetCapacity: 6 },
  { name: 'Reparatur-Café', description: 'Defekte Geräte, Klamotten, Möbel gemeinsam wieder fit machen.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Fahrrad-Werkstatt', description: 'Reifen flicken, Schaltung einstellen, Fahrrad-Pflege.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Holzschnitzen', description: 'Schnitzmesser sicher führen — Tiere, Löffel, kleine Figuren.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Lederarbeiten', description: 'Geldbeutel, Armband, Schlüsseltasche — alles aus Pflanzen-Leder.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Kerzen und Seife selber machen', description: 'Bienenwachskerzen ziehen, Seifen mit ätherischen Ölen.', grades: [5, 6, 7, 8, 9, 10], maxCapacity: 14, targetCapacity: 12 },
  // Soziales
  { name: 'Streitschlichter-Ausbildung', description: 'Mediation lernen, Konflikte auf dem Pausenhof entschärfen.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Schulsanitätsdienst', description: 'Erste Hilfe vertiefen, Pausenhof-Einsätze, Notfälle üben.', grades: [9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Lesepatenschaft mit Grundschule', description: 'Mit Erstklässlern lesen und Geschichten erfinden.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 14 },
  { name: 'Besuch im Seniorenheim', description: 'Spielen, Vorlesen, Geschichten austauschen — Generationen verbinden.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 16, targetCapacity: 12 },
  { name: 'Müll sammeln und Upcycling', description: 'Park und Wald sauber machen, Fundstücke kreativ verwerten.', grades: [5, 6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 18, targetCapacity: 14 },
  { name: 'Kompostierung und Bodenkunde', description: 'Wurmkiste bauen, Bokashi, gesunde Erde verstehen.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  // Kulinarisch
  { name: 'Backen: Brot und Kuchen', description: 'Sauerteig ansetzen, Hefe verstehen, eigene Lieblingsbrote.', grades: [6, 7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Vegetarische Küche', description: 'Gemüse neu entdecken — von Lasagne bis Buddha-Bowl.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Internationale Frühstücke', description: 'Jeden Tag ein anderes Land beim ersten Bissen.', grades: [5, 6, 7, 8, 9, 10], maxCapacity: 16, targetCapacity: 12 },
  { name: 'Eis und Sorbets selber machen', description: 'Fruchteis, Cremeeis, exotische Sorten ohne Eismaschine.', grades: [5, 6, 7, 8, 9, 10], maxCapacity: 14, targetCapacity: 12 },
  { name: 'Cocktails alkoholfrei', description: 'Sirup ansetzen, Garnieren, Mocktails für die Schulparty.', grades: [9, 10, 11, 12, 13], maxCapacity: 14, targetCapacity: 12 },
  // Knobel & Spiele
  { name: 'Escape-Room entwerfen', description: 'Eigenes Rätselspiel inkl. Story für die Mitschüler bauen.', grades: [8, 9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Magie und Zauberkunst', description: 'Karten- und Münztricks, kleine Bühnenshow am Ende.', grades: [5, 6, 7, 8, 9, 10], maxCapacity: 12, targetCapacity: 10 },
  { name: 'Pen-and-Paper-Rollenspiele', description: 'Eigene Welten erfinden und Abenteuer durchspielen.', grades: [7, 8, 9, 10, 11, 12, 13], maxCapacity: 10, targetCapacity: 8 },
  { name: 'Programmierwettbewerb Vorbereitung', description: 'Algorithmen üben für Bundeswettbewerb Informatik.', grades: [9, 10, 11, 12, 13], maxCapacity: 12, targetCapacity: 8 },
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
