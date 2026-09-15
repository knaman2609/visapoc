import { expect } from '@playwright/test'

/**
 * Shared handles for the studio.
 *
 * Everything here addresses the page the way a person does — a landmark, a
 * role, a visible label — so a test fails when the screen stops working
 * rather than when a class name changes.
 */
export const studio = (page) => ({
  page,
  rail: page.getByRole('navigation', { name: 'Studio panels' }),
  panel: page.getByRole('complementary', { name: 'Studio panel' }),
  props: page.getByRole('complementary', { name: 'Properties' }),
  channels: page.getByRole('group', { name: 'Channel' }),
  surfaces: page.getByRole('group', { name: 'Surface' }),
  name: page.getByLabel('Design name'),
  // The studio's own top chrome, told apart from the app shell's header by
  // the one control only it has.
  topbar: page.locator('header').filter({ has: page.getByLabel('Design name') }),
  state: page.getByLabel('Design state'),
  caption: page.locator('[aria-label="Artboard"] p').last(),

  tab: (label) => page.getByRole('button', { name: label, exact: true }),
  // Clicking the active tab collapses the panel, so opening one has to be
  // idempotent or a helper turns the thing it wanted to see off.
  openTab: async (label) => {
    const btn = page.getByRole('navigation', { name: 'Studio panels' })
      .getByRole('button', { name: label })
    if (await btn.getAttribute('aria-pressed') !== 'true') await btn.click()
    await expect(page.getByRole('complementary', { name: 'Studio panel' })).toBeVisible()
  },
  channel: (label) => page.getByRole('group', { name: 'Channel' })
    .getByRole('button', { name: label }),
  // Surfaces are addressed as "Group · Label" because two of them are called
  // Gmail — the inbox row and the desktop client.
  surface: (name) => page.getByRole('group', { name: 'Surface' })
    .getByRole('button', { name, exact: true }),
  cards: () => page.locator('button[aria-label^="Open "]'),
})

/** Where the suite is pointed. Asserted on every visit, not just configured. */
export const TARGET = 'http://localhost:5173'

/** Every studio test starts on a clean library so the seed is the fixture. */
export async function openStudio(page) {
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('/pm/studio')
  // Prove the target rather than trusting the config: a stale server on
  // another port would otherwise let the whole suite pass against nothing.
  expect(new URL(page.url()).origin).toBe(TARGET)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await expect(page.getByLabel('Design name')).toBeVisible()
  return { s: studio(page), page, errors }
}

/**
 * The library screen. Browsing what exists is its own page now, reached from
 * the sidebar, so it is a navigation rather than a panel.
 */
export async function openLibrary(page) {
  await page.goto('/pm/studio/designs')
  expect(new URL(page.url()).origin).toBe(TARGET)
  await expect(page.getByRole('heading', { name: 'Saved designs' })).toBeVisible()
  return { s: studio(page), page }
}

/**
 * Start a design from the "New design" screen and land in the editor.
 *
 * The screen opens on a single button; the layouts only appear once you have
 * said you want one, so getting to a document is two clicks.
 */
export async function startDesign(page, from = 'a blank artboard') {
  await page.goto('/pm/studio/new')
  await page.getByRole('button', { name: 'Start a new design' }).click()
  await page.getByRole('button', { name: `Start from ${from}` }).click()
  await expect(page.getByLabel('Design name')).toBeVisible()
  return studio(page)
}

/** The block a surface draws, so a mock can be asserted on its own content. */
export const artboard = (page) => page.locator('[aria-label="Artboard"]')
