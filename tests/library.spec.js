import { expect, test } from '@playwright/test'
import { openLibrary, studio } from './helpers.js'

/**
 * Saved designs, on its own screen.
 *
 * Browsing what exists used to be a tab in the studio rail. It is a page now,
 * reached from the sidebar, so these tests are about a screen rather than a
 * panel: what it counts, how it filters and sorts, and that opening a card
 * really lands you in that document.
 */
test.describe('Saved designs', () => {
  test('lists the library, newest first, and counts what it holds', async ({ page }) => {
    const { s } = await openLibrary(page)
    await expect(s.cards()).toHaveCount(9)
    await expect(s.cards().first()).toContainText('October benefit sweep')
    await expect(s.cards().first()).toContainText('6.8%')
    await expect(s.cards().first()).toContainText('1,28,400')

    // Seven of the nine have shipped; the summary is derived, not hard-coded.
    const stats = page.locator('dl, [class*="stats"]').first()
    await expect(stats).toContainText('9')
    await expect(stats).toContainText('7')
    await expect(stats).toContainText('5,01,740')
    await expect(stats).toContainText('11.3%')
  })

  test('a card says which channels it covers', async ({ page }) => {
    const { s } = await openLibrary(page)
    const first = s.cards().first()
    for (const c of ['Email', 'WhatsApp', 'SMS']) await expect(first).toContainText(c)
  })

  test('opening a card lands in that document', async ({ page }) => {
    const { page: p } = await openLibrary(page)
    await p.locator('button[aria-label="Open Card education — three reasons"]').click()

    await expect(p).toHaveURL(/\/pm\/studio\?design=/)
    const s = studio(p)
    await expect(s.name).toHaveValue('Card education — three reasons')
    await expect(s.state).toHaveValue('review')
  })

  test('search matches name, campaign and tag', async ({ page }) => {
    const { s, page: p } = await openLibrary(page)
    const q = p.getByLabel('Search designs')
    await q.fill('expiry')
    await expect(s.cards()).toHaveCount(1)
    await q.fill('Dining spend lift')
    await expect(s.cards()).toHaveCount(1)
    await expect(s.cards().first()).toContainText('5,000 point offer panel')
    await q.fill('whatsapp')
    await expect(s.cards()).toHaveCount(1)
    await q.fill('zzz')
    await expect(s.cards()).toHaveCount(0)
    await expect(p.getByText(/Nothing matches/)).toBeVisible()
  })

  test('filter chips narrow the list', async ({ page }) => {
    const { s, page: p } = await openLibrary(page)
    for (const [chip, n] of [['Starred', 2], ['Live', 3], ['Drafts', 2], ['Archived', 1], ['All', 9]]) {
      await p.getByRole('button', { name: chip, exact: true }).click()
      await expect(s.cards(), `${chip} should show ${n}`).toHaveCount(n)
    }
  })

  test('sort reorders by name, reach and click rate', async ({ page }) => {
    const { s, page: p } = await openLibrary(page)
    const sort = p.getByLabel('Sort designs')
    await sort.selectOption('name')
    await expect(s.cards().first()).toContainText('5,000 point offer panel')
    await sort.selectOption('reach')
    await expect(s.cards().first()).toContainText('SMS — one segment')
    await sort.selectOption('click')
    await expect(s.cards().first()).toContainText('Expiry — 14 day push')
    await sort.selectOption('recent')
    await expect(s.cards().first()).toContainText('October benefit sweep')
  })

  test('starring moves a design into the starred filter', async ({ page }) => {
    const { s, page: p } = await openLibrary(page)
    await p.locator('button[aria-label="Star"]').first().click()
    await p.getByRole('button', { name: 'Starred', exact: true }).click()
    await expect(s.cards()).toHaveCount(3)
  })

  test('duplicate adds a copy without leaving the screen', async ({ page }) => {
    const { s, page: p } = await openLibrary(page)
    await p.locator('button[aria-label="Duplicate"]').first().click()
    await expect(s.cards()).toHaveCount(10)
    await expect(s.cards().first()).toContainText('October benefit sweep copy')
    // A copy has not shipped, so it carries no numbers.
    await expect(s.cards().first()).toContainText('Never sent')
    await expect(p).toHaveURL(/\/pm\/studio\/designs/)
  })

  test('delete needs a second click', async ({ page }) => {
    const { s, page: p } = await openLibrary(page)
    await p.locator('button[aria-label="Delete"]').nth(1).click()
    await expect(s.cards()).toHaveCount(9)
    await p.locator('button[aria-label="Confirm delete"]').click()
    await expect(s.cards()).toHaveCount(8)
    await expect(p.locator('body')).not.toContainText('Expiry — 14 day push')
  })

  test('deletions survive a refresh', async ({ page }) => {
    const { s, page: p } = await openLibrary(page)
    await p.locator('button[aria-label="Delete"]').first().click()
    await p.locator('button[aria-label="Confirm delete"]').click()
    await expect(s.cards()).toHaveCount(8)
    await p.reload()
    await expect(studio(p).cards()).toHaveCount(8)
  })

  test('an emptied library still offers a way to start', async ({ page }) => {
    const { s, page: p } = await openLibrary(page)
    for (let i = 0; i < 9; i += 1) {
      await p.locator('button[aria-label="Delete"]').first().click()
      await p.locator('button[aria-label="Confirm delete"]').click()
    }
    await expect(s.cards()).toHaveCount(0)
    await expect(p.getByText(/Nothing saved under this filter/)).toBeVisible()
    await p.getByRole('button', { name: /Start a design/ }).click()
    await expect(p).toHaveURL(/\/pm\/studio\/new/)
  })

  test('the new design button reaches the start screen', async ({ page }) => {
    const { page: p } = await openLibrary(page)
    await p.getByRole('button', { name: 'Start a new design' }).click()
    await expect(p).toHaveURL(/\/pm\/studio\/new/)
    await expect(p.getByRole('heading', { name: 'New design' })).toBeVisible()
  })
})
