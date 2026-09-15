import { expect, test } from '@playwright/test'
import { artboard, openLibrary, openStudio, startDesign, studio } from './helpers.js'

const reload = async (page) => {
  await page.reload()
  await expect(page.getByLabel('Design name')).toBeVisible()
}

test.describe('Persistence', () => {
  test('a rename, an edit and a kit all survive a refresh', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.name.fill('October sweep, second pass')
    await s.state.selectOption('approved')

    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: /Rohit, 5,000 bonus points/ }).first().click()
    await s.props.getByLabel('Copy').fill('A headline written to be remembered')

    await s.openTab('Brand kit')
    await s.panel.getByRole('button', { name: /Plum/ }).click()

    // The save is debounced; wait for it to say it is done rather than for a
    // clock. "Saving…" while pending, "Saved <when>" once written.
    await expect(s.topbar).toContainText(/^.*Saved /, { timeout: 5000 })
    await reload(p)

    const t = studio(p)
    await expect(t.name).toHaveValue('October sweep, second pass')
    await expect(t.state).toHaveValue('approved')
    await t.surface('Inbox · Apple Mail').click()
    await expect(artboard(p)).toContainText('A headline written to be remembered')
    await t.openTab('Brand kit')
    await expect(t.panel.getByRole('button', { name: /Plum/ }))
      .toHaveAttribute('aria-pressed', 'true')
  })

  test('a new design and a deletion both survive a refresh', async ({ page }) => {
    const { page: p } = await openStudio(page)
    const s = await startDesign(p)
    await s.name.fill('Made in this session')
    await expect(s.topbar).toContainText(/Saved /)

    await openLibrary(p)
    await p.locator('button[aria-label="Delete"]').nth(1).click()
    await p.locator('button[aria-label="Confirm delete"]').click()
    await expect(s.cards()).toHaveCount(9)

    await reload(p)
    await expect(studio(p).cards()).toHaveCount(9)
    await expect(p.locator('main, body')).toContainText('Made in this session')
    await expect(p.locator('body')).not.toContainText('October benefit sweep')
  })

  test('storage that no longer makes sense falls back to the seed', async ({ page }) => {
    const { page: p } = await openStudio(page)
    await p.evaluate(() => window.localStorage.setItem('visa.studio.library.v3', '{"nope":true}'))
    await reload(p)
    await expect(studio(p).cards()).toHaveCount(9)

    await p.evaluate(() => window.localStorage.setItem('visa.studio.library.v3', '[{"id":"x"}]'))
    await reload(p)
    await expect(studio(p).cards()).toHaveCount(9)

    await p.evaluate(() => window.localStorage.setItem('visa.studio.library.v3', 'not json at all'))
    await reload(p)
    await expect(studio(p).cards()).toHaveCount(9)
  })

  test('previewing another channel does not relabel the design', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.channel('WhatsApp').click()
    await s.channel('SMS').click()
    await expect(s.topbar).toContainText(/Saved /)
    await reload(p)
    await openLibrary(p)
    await expect(studio(p).cards().first()).toContainText('Email')
  })
})

test.describe('Undo', () => {
  test('walks back through edits, kit changes and layout swaps', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    const undo = p.getByRole('button', { name: 'Undo' })
    const redo = p.getByRole('button', { name: 'Redo' })
    await expect(undo).toBeDisabled()
    await expect(redo).toBeDisabled()

    await s.openTab('Brand kit')
    await s.panel.getByRole('button', { name: /Evergreen/ }).click()
    const cta = artboard(p).getByText('See your travel benefits')
    await expect(cta).toHaveCSS('background-color', 'rgb(15, 107, 82)')

    await undo.click()
    await expect(cta).toHaveCSS('background-color', 'rgb(20, 52, 203)')
    await redo.click()
    await expect(cta).toHaveCSS('background-color', 'rgb(15, 107, 82)')
  })

  test('a run of typing is one step back, not forty', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    const box = s.props.getByLabel('Copy')
    await box.fill('')
    await box.pressSequentially('Points ready')
    await expect(box).toHaveValue('Points ready')

    await p.getByRole('button', { name: 'Undo' }).click()
    // One undo, not one per keystroke.
    await expect(box).not.toHaveValue('Points read')
  })

  test('applying a layout is undoable', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await expect(artboard(p)).toContainText('5,000 bonus points are on your Visa Infinite')

    await s.openTab('Templates')
    await p.getByRole('button', { name: /Statement style/ }).click()
    await p.getByRole('button', { name: 'Use this layout' }).click()
    await expect(artboard(p)).toContainText('benefits statement')

    await p.getByRole('button', { name: 'Undo' }).click()
    await expect(artboard(p)).toContainText('5,000 bonus points are on your Visa Infinite')
  })

  test('the keyboard does the same thing as the buttons', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Banner' }).first().click()
    await p.keyboard.press('Delete')
    await expect(artboard(p).locator('[class*="bannerCard"]')).toHaveCount(0)
    await p.keyboard.press('Meta+z')
    await expect(artboard(p).locator('[class*="bannerCard"]')).toBeVisible()
  })
})
