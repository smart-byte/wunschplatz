import { Link } from 'react-router-dom';
import { COMPANY } from '@/lib/company';
import { CountingSwitch } from './CountingSwitch';

export function PrivacyDe() {
  return (
    <>
      <h2>Kurz gesagt</h2>
      <ul>
        <li>
          Schülerdaten, Wunschrunden und Einstellungen bleiben in deinem Browser. Nichts davon wird
          an uns oder einen anderen Server gesendet.
        </li>
        <li>Kein Konto, keine Cookies, kein Newsletter und kein Kontaktformular.</li>
        <li>Wir zählen Besuche ohne Cookies auf unserem eigenen Server.</li>
        <li>Das Zählen kannst du für deinen Browser jederzeit ausschalten.</li>
      </ul>

      <h2>Verantwortlicher</h2>
      <p>Verantwortlich für wunschplatz.app ist:</p>
      <address>
        <strong>{COMPANY.name}</strong>
        <br />
        {COMPANY.street}, {COMPANY.city}
        <br />
        Vertreten durch den Geschäftsführer {COMPANY.managingDirector}
        <br />
        E-Mail: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        <br />
        Telefon: {COMPANY.phone}
      </address>
      <p>
        Für Fragen zum Datenschutz schreib uns an{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Die vollständigen Anbieterangaben
        stehen im <Link to="/impressum">Impressum</Link>.
      </p>

      <h2>Hosting und Auslieferung</h2>
      <p>
        Wunschplatz hat kein eigenes Backend. Die Website wird über GitHub Pages ausgeliefert, einen
        Dienst von GitHub, Inc. in den USA. Beim Aufruf verarbeitet GitHub deine IP-Adresse und
        Angaben zur Anfrage, um die Seite auszuliefern und abzusichern. Details stehen in der{' '}
        <a
          href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement"
          target="_blank"
          rel="noreferrer"
        >
          Datenschutzerklärung von GitHub
        </a>
        .
      </p>
      <ul>
        <li>
          <strong>Rechtsgrundlage:</strong> unser berechtigtes Interesse an einer sicheren und
          zuverlässigen Auslieferung der Website (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO).
        </li>
        <li>
          <strong>Übermittlung in die USA:</strong> auf Grundlage des EU-US Data Privacy Framework.
        </li>
      </ul>
      <p>
        Das DNS der Domain wird bei Cloudflare verwaltet. Cloudflare löst nur den Namen auf.
        Seitenaufrufe gehen direkt an GitHub Pages, nicht über Cloudflare.
      </p>
      <p>
        Der Quellcode steht öffentlich auf GitHub:{' '}
        <a href="https://github.com/smart-byte/wunschplatz" target="_blank" rel="noreferrer">
          github.com/smart-byte/wunschplatz
        </a>
        .
      </p>

      <h2>Daten in deinem Browser</h2>
      <p>
        Alles, was du in Wunschplatz eingibst oder importierst, bleibt in deinem Browser:
        Wunschrunden mit ihren Projekten, Schülerdaten mit Namen, Klassen, Jahrgängen, Wünschen und
        Gruppen, Formularvorlagen, Verteilungen und Einstellungen. Sie liegen in der IndexedDB
        deines Browsers.
      </p>
      <p>
        Außerdem speichert die App im lokalen Speicher deines Browsers die Sprache, die zuletzt
        geöffnete Wunschrunde (zusätzlich im Sitzungsspeicher), einige Ansichtseinstellungen wie
        Sortierung und aktiven Reiter der Verteilung und einen Zähler, mit dem geöffnete
        Browser-Tabs ihre Änderungen abgleichen.
      </p>
      <p>
        Nichts davon wird an uns oder einen anderen Server gesendet. Die Speicherung ist technisch
        notwendig (§&nbsp;25 Abs.&nbsp;2 Nr.&nbsp;2 TDDDG), deshalb ist dafür keine Einwilligung
        nötig.
      </p>
      <p>
        Wenn du die Website-Daten deines Browsers löschst, sind alle Wunschrunden und Schülerdaten
        dauerhaft weg. Exportiere vorher, was du behalten willst. Dafür bietet die App einen
        Excel-Export.
      </p>

      <h2>Besuchsstatistik mit Umami</h2>
      <p>
        Die Besuchsstatistik läuft nur auf wunschplatz.app. Wir zählen Besuche mit Umami, einer
        Open-Source-Software, die wir selbst unter analytics.smart-byte.com betreiben. Der Server
        steht bei der Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland, und
        liegt in Finnland. Hetzner verarbeitet die Daten in unserem Auftrag auf Grundlage eines
        Auftragsverarbeitungsvertrags (Art.&nbsp;28 DSGVO). Sonst erhält niemand diese Daten.
      </p>
      <p>Wenn eine Seite lädt, sendet dein Browser an unseren Server:</p>
      <ul>
        <li>
          die Adresse der Seite ohne Query-String und Fragment sowie den Seitentitel. Seitentitel
          und Seitenadressen enthalten nie Angaben zu Wunschrunden, Projekten oder Schülern;
        </li>
        <li>die Seite, von der du kommst (Referrer). Browser teilen meist nur die Domain mit;</li>
        <li>Browser, Betriebssystem, Gerätetyp, Bildschirmgröße und Sprache.</li>
      </ul>
      <p>
        Aus deiner IP-Adresse ermittelt unser Server deinen ungefähren Standort (Land, Region und
        Stadt). Die IP-Adresse selbst wird nicht gespeichert.
      </p>
      <p>
        Umami setzt keine Cookies und speichert nichts auf deinem Gerät. Um Besuche zu
        unterscheiden, bildet Umami aus deiner IP-Adresse, dem User-Agent deines Browsers und einem
        Salt, der sich jeden Tag ändert, eine pseudonyme Kennung. So lassen sich Besuche nicht über
        mehrere Tage hinweg verknüpfen. Wir werten die Daten nur zusammengefasst aus, um zu sehen,
        welche Seiten helfen und was wir verbessern können. Wir bilden keine Profile und führen die
        Daten nicht mit anderen Daten zusammen.
      </p>
      <ul>
        <li>
          <strong>Rechtsgrundlage:</strong> unser berechtigtes Interesse, die Website zu verbessern
          (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO).
        </li>
        <li>
          <strong>Speicherdauer:</strong> Die Analysedaten werden nach 13 Monaten gelöscht.
        </li>
        <li>
          <strong>Do Not Track:</strong> Browser, die Do Not Track senden, werden nicht gezählt.
        </li>
      </ul>
      <p>
        Entfernst du unten den Haken, zählt Umami keine Besuche mehr aus diesem Browser. Dein
        Browser speichert dafür den Eintrag umami.disabled im lokalen Speicher.
      </p>
      <CountingSwitch />

      <h2>Für Schulen</h2>
      <ul>
        <li>
          Schülerdaten, die du in Wunschplatz eingibst oder importierst, erreichen weder Smart-Byte
          noch einen anderen Server.
        </li>
        <li>Die Verarbeitung findet auf dem Gerät der Schule statt.</li>
        <li>
          Für Daten, die du mit Google Forms oder Microsoft Forms erhebst, sind die Schule und der
          jeweilige Anbieter verantwortlich.
        </li>
      </ul>

      <h2>Google Forms, Microsoft Forms und Links</h2>
      <p>
        Wunschplatz erstellt nur Formularvorlagen und eine Beschreibung, die du in Google Gemini
        kopieren kannst, um ein Google-Formular zu bauen. Die Links in der App führen zu den
        Websites von Google und Microsoft.
      </p>
      <p>
        Formulare legst du in deinem eigenen Google- oder Microsoft-Konto an. Dort speichern und
        verarbeiten Google bzw. Microsoft die Antworten nach ihren Bedingungen und den
        Vereinbarungen deiner Schule mit dem Anbieter:
      </p>
      <ul>
        <li>
          Google:{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            Datenschutzerklärung von Google
          </a>
        </li>
        <li>
          Microsoft:{' '}
          <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noreferrer">
            Datenschutzerklärung von Microsoft
          </a>
        </li>
      </ul>
      <p>
        Du exportierst die Antworten als CSV-Datei und importierst sie in Wunschplatz. Der Import
        läuft lokal in deinem Browser.
      </p>

      <h2>Deine Rechte</h2>
      <p>Nach der DSGVO hast du das Recht auf:</p>
      <ul>
        <li>Auskunft über deine Daten (Art.&nbsp;15 DSGVO)</li>
        <li>Berichtigung unrichtiger Daten (Art.&nbsp;16 DSGVO)</li>
        <li>Löschung deiner Daten (Art.&nbsp;17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art.&nbsp;18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art.&nbsp;20 DSGVO)</li>
        <li>
          Widerspruch gegen eine Verarbeitung aufgrund berechtigter Interessen (Art.&nbsp;21 DSGVO)
        </li>
      </ul>
      <p>
        Wir haben deine Wunschrunden und Schülerdaten nicht. Auskunft, Berichtigung und Löschung
        kannst du deshalb selbst ausüben, etwa in der App oder über die Website-Daten deines
        Browsers. Anfragen richtest du an <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>
      <p>
        Für die Besuchsstatistik speichern wir keine IP-Adressen, und die pseudonyme Kennung
        wechselt täglich. Deshalb können wir Statistikdaten meist keiner Person zuordnen.
      </p>
      <p>
        Wo wir uns auf berechtigte Interessen stützen, kannst du aus Gründen deiner besonderen
        Situation widersprechen. Für die Besuchsstatistik wirkt die Einstellung oben sofort in
        diesem Browser.
      </p>
      <p>
        Du kannst dich bei einer Datenschutzaufsichtsbehörde beschweren (Art.&nbsp;77 DSGVO),
        besonders in dem EU-Staat, in dem du lebst oder arbeitest. Zuständig für uns ist das
        Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach,{' '}
        <a href="https://www.lda.bayern.de" target="_blank" rel="noreferrer">
          www.lda.bayern.de
        </a>
        .
      </p>

      <h2>Änderungen</h2>
      <p>Wir passen diese Erklärung an, wenn sich die Website oder die Rechtslage ändert.</p>
      <p>Stand: Oktober 2026</p>
    </>
  );
}

export function PrivacyEn() {
  return (
    <>
      <p>This is an English translation. The German version is authoritative.</p>

      <h2>In short</h2>
      <ul>
        <li>
          Student data, wish rounds and settings stay in your browser. Nothing is sent to us or to
          any other server.
        </li>
        <li>No account, no cookies, no newsletter and no contact form.</li>
        <li>We count visits without cookies on our own server.</li>
        <li>You can turn counting off for your browser at any time.</li>
      </ul>

      <h2>Controller</h2>
      <p>The controller for wunschplatz.app is:</p>
      <address>
        <strong>{COMPANY.name}</strong>
        <br />
        {COMPANY.street}, {COMPANY.city}
        <br />
        Managing director: {COMPANY.managingDirector}
        <br />
        Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        <br />
        Phone: {COMPANY.phone}
      </address>
      <p>
        For privacy questions, write to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        Full provider details are in the <Link to="/impressum">legal notice</Link>.
      </p>

      <h2>Hosting and delivery</h2>
      <p>
        Wunschplatz has no backend of its own. The website is delivered through GitHub Pages, a
        service of GitHub, Inc. in the USA. When you visit the site, GitHub processes your IP
        address and request details to deliver and secure it. Details are in GitHub’s{' '}
        <a
          href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement"
          target="_blank"
          rel="noreferrer"
        >
          privacy statement
        </a>
        .
      </p>
      <ul>
        <li>
          <strong>Legal basis:</strong> our legitimate interest in delivering the website securely
          and reliably (Art.&nbsp;6(1)(f) GDPR).
        </li>
        <li>
          <strong>Transfer to the USA:</strong> based on the EU-U.S. Data Privacy Framework.
        </li>
      </ul>
      <p>
        The domain’s DNS is managed at Cloudflare, which only resolves the name. Page requests go
        directly to GitHub Pages, not through Cloudflare.
      </p>
      <p>
        The source code is public on GitHub:{' '}
        <a href="https://github.com/smart-byte/wunschplatz" target="_blank" rel="noreferrer">
          github.com/smart-byte/wunschplatz
        </a>
        .
      </p>

      <h2>Data in your browser</h2>
      <p>
        Everything you enter or import stays in your browser: wish rounds with their projects,
        student data with names, classes, grade levels, wishes and groups, form templates,
        distributions and settings. They are stored in your browser’s IndexedDB.
      </p>
      <p>
        The app also keeps your language, the wish round you opened last (also in session storage),
        some view settings such as the sort order and active tab of the distribution, and a counter
        that lets open browser tabs sync their changes. All of this stays in your browser.
      </p>
      <p>
        None of this is sent to us or to any other server. This storage is technically necessary
        (§&nbsp;25(2) No.&nbsp;2 TDDDG), so no consent is needed for it.
      </p>
      <p>
        If you delete the website data in your browser, all wish rounds and student data are gone
        for good. Export what you want to keep first. The app offers an Excel export for this.
      </p>

      <h2>Visit statistics with Umami</h2>
      <p>
        Visit statistics run only on wunschplatz.app. We count visits with Umami, open-source
        analytics software that we run ourselves at analytics.smart-byte.com, on a server of Hetzner
        Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Germany, located in Finland. Hetzner
        processes this data on our behalf under a data processing agreement (Art.&nbsp;28 GDPR).
        Nobody else receives it.
      </p>
      <p>When a page loads, your browser sends the following to our server:</p>
      <ul>
        <li>
          the page’s address without query string or fragment, and its title. Page titles and page
          addresses never contain data about wish rounds, projects or students;
        </li>
        <li>the page you came from (referrer). Browsers usually share only the domain;</li>
        <li>your browser, operating system, device type, screen size and language.</li>
      </ul>
      <p>
        From your IP address, our server works out your approximate location (country, region and
        city). The IP address itself is not stored.
      </p>
      <p>
        Umami sets no cookies and stores nothing on your device. To tell visits apart, it derives a
        pseudonymous identifier from your IP address, your browser’s user agent and a salt that
        changes every day, so visits cannot be linked across days. We look at the results only in
        aggregate, to see which pages help and what to improve. We don’t build profiles or combine
        this data with anything else.
      </p>
      <ul>
        <li>
          <strong>Legal basis:</strong> our legitimate interest in improving the website
          (Art.&nbsp;6(1)(f) GDPR).
        </li>
        <li>
          <strong>Retention:</strong> analytics records are deleted after 13 months.
        </li>
        <li>
          <strong>Do Not Track:</strong> browsers that send Do Not Track are not counted.
        </li>
      </ul>
      <p>
        Untick the box below and Umami stops counting visits from this browser. Your browser then
        stores the entry umami.disabled in its local storage.
      </p>
      <CountingSwitch />

      <h2>For schools</h2>
      <ul>
        <li>
          Student data that you enter or import into Wunschplatz never reaches Smart-Byte or any
          other server.
        </li>
        <li>Processing happens on the school’s device.</li>
        <li>
          For data collected with Google Forms or Microsoft Forms, the school and the form provider
          are responsible.
        </li>
      </ul>

      <h2>Google Forms, Microsoft Forms and links</h2>
      <p>
        Wunschplatz only generates form templates, and a description you can copy into Google Gemini
        to build a Google form. The links in the app open the websites of Google and Microsoft.
      </p>
      <p>
        You create forms in your own Google or Microsoft account. Google or Microsoft store and
        process the responses under their terms and under your school’s agreements with them:
      </p>
      <ul>
        <li>
          Google:{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            Google privacy policy
          </a>
        </li>
        <li>
          Microsoft:{' '}
          <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noreferrer">
            Microsoft privacy statement
          </a>
        </li>
      </ul>
      <p>
        You export the responses as a CSV file and import them into Wunschplatz. The import runs
        locally in your browser.
      </p>

      <h2>Your rights</h2>
      <p>Under the GDPR you have the right to:</p>
      <ul>
        <li>access to your data (Art.&nbsp;15 GDPR)</li>
        <li>rectification of inaccurate data (Art.&nbsp;16 GDPR)</li>
        <li>erasure of your data (Art.&nbsp;17 GDPR)</li>
        <li>restriction of processing (Art.&nbsp;18 GDPR)</li>
        <li>data portability (Art.&nbsp;20 GDPR)</li>
        <li>objection to processing based on legitimate interests (Art.&nbsp;21 GDPR)</li>
      </ul>
      <p>
        We don’t hold your wish rounds or student data. You can therefore exercise access,
        rectification and erasure yourself, for example in the app or through your browser’s website
        data. Send any other requests to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>
      <p>
        For visit statistics, we store no IP addresses, and the pseudonymous identifier changes
        every day. That means we usually cannot link analytics records to you.
      </p>
      <p>
        Where we process data on the basis of legitimate interests (Art.&nbsp;6(1)(f) GDPR), you can
        object at any time on grounds relating to your particular situation. For visit statistics,
        the setting above takes effect immediately in this browser.
      </p>
      <p>
        You can also lodge a complaint with a data protection supervisory authority (Art.&nbsp;77
        GDPR), in particular in the EU member state where you live or work. The authority
        responsible for us is the Bavarian State Office for Data Protection Supervision (BayLDA),
        Promenade 18, 91522 Ansbach, Germany,{' '}
        <a href="https://www.lda.bayern.de" target="_blank" rel="noreferrer">
          www.lda.bayern.de
        </a>
        .
      </p>

      <h2>Changes</h2>
      <p>We update this policy when the website or the law changes.</p>
      <p>Last updated: October 2026</p>
    </>
  );
}
