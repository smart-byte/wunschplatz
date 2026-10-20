import { Link } from 'react-router-dom';
import { COMPANY } from '@/lib/company';

export function ImpressumDe() {
  return (
    <>
      <p>Angaben gemäß § 5 DDG.</p>
      <address>
        <strong>{COMPANY.name}</strong>
        <br />
        {COMPANY.street}
        <br />
        {COMPANY.city}
        <br />
        Vertreten durch den Geschäftsführer {COMPANY.managingDirector}
      </address>

      <h2>Kontakt</h2>
      <p>
        Telefon: {COMPANY.phone}
        <br />
        E-Mail: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        <br />
        Webseite:{' '}
        <a href={COMPANY.website} target="_blank" rel="noreferrer">
          {COMPANY.website}
        </a>
      </p>

      <h2>Registereintrag</h2>
      <p>
        Registergericht: Amtsgericht München
        <br />
        Registernummer: {COMPANY.registerNumber}
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {COMPANY.vatId}</p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: {COMPANY.managingDirector} (Anschrift
        wie oben)
      </p>

      <h2>Streitbeilegung</h2>
      <p>
        Wir nehmen nicht an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil.
      </p>

      <p>
        Zur <Link to="/datenschutz">Datenschutzerklärung</Link>.
      </p>
    </>
  );
}

export function ImpressumEn() {
  return (
    <>
      <p>This is an English translation. The German version is authoritative.</p>
      <p>Information pursuant to § 5 DDG.</p>
      <address>
        <strong>{COMPANY.name}</strong>
        <br />
        {COMPANY.street}
        <br />
        {COMPANY.city}
        <br />
        Represented by managing director {COMPANY.managingDirector}
      </address>

      <h2>Contact</h2>
      <p>
        Phone: {COMPANY.phone}
        <br />
        Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        <br />
        Website:{' '}
        <a href={COMPANY.website} target="_blank" rel="noreferrer">
          {COMPANY.website}
        </a>
      </p>

      <h2>Register entry</h2>
      <p>
        Registry court: Munich Local Court (Amtsgericht München)
        <br />
        Registration number: {COMPANY.registerNumber}
      </p>

      <h2>VAT ID</h2>
      <p>VAT identification number pursuant to § 27a UStG: {COMPANY.vatId}</p>

      <h2>Responsible for content</h2>
      <p>
        Responsible for content pursuant to § 18 Abs. 2 MStV: {COMPANY.managingDirector} (address as
        above)
      </p>

      <h2>Dispute resolution</h2>
      <p>
        We do not participate in dispute resolution proceedings before a consumer arbitration board.
      </p>

      <p>
        See our <Link to="/datenschutz">privacy policy</Link>.
      </p>
    </>
  );
}
