import { test, expect, type Page } from '@playwright/test';

async function addProject(page: Page, name: string, max: number) {
  await page.getByRole('button', { name: 'Neues Projekt', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel(/Jahrgänge/).fill('7');
  await page.getByLabel('Max-Kapazität').fill(String(max));
  await page.getByLabel('Soll-Kapazität').fill(String(max));
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
}

async function addStudent(page: Page, firstName: string, wishes: string[]) {
  await page.getByRole('button', { name: 'Neuer Schüler', exact: true }).click();
  await page.getByLabel('Vorname', { exact: true }).fill(firstName);
  await page.getByLabel('Nachname', { exact: true }).fill('Beispiel');
  await page.getByLabel('Klasse', { exact: true }).fill('7a');
  for (const [i, wish] of wishes.entries()) {
    await page.getByRole('combobox', { name: `Prio ${i + 1}`, exact: true }).click();
    await page.getByRole('option', { name: wish, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(
    page.getByRole('cell', { name: `Beispiel, ${firstName}`, exact: true }),
  ).toBeVisible();
}

test('the board narrows to projects that need attention or to one student', async ({ page }) => {
  await page.goto('/projects');
  await addProject(page, 'Alpha', 1);
  await addProject(page, 'Beta', 5);
  await page.getByRole('navigation').getByRole('link', { name: 'Schüler' }).click();
  // Alpha fits one student, so one of Ben and Cem must land outside their wishes in Beta.
  await addStudent(page, 'Ada', ['Alpha', 'Beta']);
  await addStudent(page, 'Ben', ['Alpha']);
  await addStudent(page, 'Cem', ['Alpha']);
  await page.getByRole('navigation').getByRole('link', { name: 'Optimierung' }).click();
  await page.getByRole('button', { name: 'Verteilung berechnen' }).click();
  await expect(page).toHaveURL(/\/distribution/);

  const card = (name: string) => page.getByRole('region', { name, exact: true });
  await expect(card('Alpha')).toBeVisible();
  const attentionOnly = page.getByRole('button', { name: /Nur Projekte mit Hinweisen/ });
  await attentionOnly.click();
  await expect(card('Beta')).toBeVisible();
  await expect(card('Alpha')).toHaveCount(0);

  await attentionOnly.click();
  await page.getByRole('searchbox', { name: 'Schüler suchen' }).fill('ada');
  await expect(card('Beta')).toContainText('Beispiel, Ada');
  await expect(card('Alpha')).toHaveCount(0);
  // The unassign drop zone stays available while searching.
  await expect(page.getByRole('heading', { name: /Unverteilt/ })).toBeVisible();
});

test('the distribution table loads long lists in pages', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Beispieldaten', exact: true }).click();
  await page.getByLabel('Anzahl Projekte').fill('5');
  await page.getByLabel('Anzahl Schüler').fill('230');
  await page.getByRole('button', { name: 'Generieren', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Optimierung' }).click();
  await page.getByRole('button', { name: 'Verteilung berechnen' }).click();
  await expect(page).toHaveURL(/\/distribution/);
  await page.getByRole('tab', { name: 'Tabelle', exact: true }).click();

  const rows = page.getByRole('tabpanel').locator('tbody tr');
  await expect(rows).toHaveCount(100);
  await page.getByRole('button', { name: 'Weitere 100 anzeigen', exact: true }).click();
  await expect(rows).toHaveCount(200);

  const name = (await rows.first().getByRole('button').first().innerText()).trim();
  const [last, first] = name.split(', ');
  await page.getByRole('searchbox', { name: 'Schüler suchen' }).fill(`${first} ${last}`);
  await expect(rows.first()).toContainText(name);
  for (const row of await rows.all()) await expect(row).toContainText(last);
});

async function boardWithAdaInAlpha(page: Page) {
  await page.goto('/projects');
  await addProject(page, 'Alpha', 5);
  await addProject(page, 'Beta', 5);
  await page.getByRole('navigation').getByRole('link', { name: 'Schüler' }).click();
  await addStudent(page, 'Ada', ['Alpha', 'Beta']);
  await page.getByRole('navigation').getByRole('link', { name: 'Optimierung' }).click();
  await page.getByRole('button', { name: 'Verteilung berechnen' }).click();
  await expect(page).toHaveURL(/\/distribution/);
  const card = (name: string) => page.getByRole('region', { name, exact: true });
  await expect(card('Alpha')).toContainText('Beispiel, Ada');
  // Pointer input only reaches what is inside the viewport.
  await card('Beta').scrollIntoViewIfNeeded();
  const centre = async (name: string) => {
    const box = (await (
      name === 'Ada' ? page.getByRole('button', { name: 'Ada Beispiel, 7a' }) : card(name)
    ).boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  return { card, from: await centre('Ada'), to: await centre('Beta') };
}

test('a student can be dragged to another project with the mouse', async ({ page }) => {
  const { card, from, to } = await boardWithAdaInAlpha(page);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 10, from.y + 10, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
  await expect(card('Beta')).toContainText('Beispiel, Ada');
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true });

  test('a long press drags a student to another project', async ({ page }) => {
    const { card, from, to } = await boardWithAdaInAlpha(page);
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
      });
    await touch('touchStart', from.x, from.y);
    // Hold past the long-press delay that tells a drag from a scroll.
    await page.waitForTimeout(400);
    for (let i = 1; i <= 10; i++)
      await touch(
        'touchMove',
        from.x + ((to.x - from.x) * i) / 10,
        from.y + ((to.y - from.y) * i) / 10,
      );
    await touch('touchEnd');
    await expect(card('Beta')).toContainText('Beispiel, Ada');
  });
});
