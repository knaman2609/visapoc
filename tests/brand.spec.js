import { expect, test } from '@playwright/test'
import { artboard, openLibrary, openStudio } from './helpers.js'

/** The kit only matters if the artboard actually repaints, so read the pixels. */
const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop)

test.describe('Brand kit', () => {
  test('a palette repaints the whole artefact', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    const cta = artboard(p).getByText('See your travel benefits')
    await expect(cta).toHaveCSS('background-color', 'rgb(20, 52, 203)')

    await s.openTab('Brand kit')
    await s.panel.getByRole('button', { name: /Midnight/ }).click()
    await expect(cta).toHaveCSS('background-color', 'rgb(17, 23, 38)')
    await expect(s.panel.getByRole('button', { name: /Midnight/ }))
      .toHaveAttribute('aria-pressed', 'true')

    await s.panel.getByRole('button', { name: /Evergreen/ }).click()
    await expect(cta).toHaveCSS('background-color', 'rgb(15, 107, 82)')
  })

  test('a type pair changes the headline face', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Brand kit')

    const heading = artboard(p).locator('h2').first()
    expect(await css(heading, 'fontFamily')).toContain('Nova Sans')

    await s.panel.getByRole('button', { name: /Serif headline/ }).click()
    expect(await css(heading, 'fontFamily')).toContain('Georgia')

    // The body stays on the system face; only the headline swaps.
    const body = artboard(p).locator('p').first()
    expect(await css(body, 'fontFamily')).not.toContain('Georgia')
  })

  test('the button shape, rhythm and width are real geometry', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Desktop · Gmail').click()
    await p.getByRole('button', { name: 'Fit to width' }).click()
    await s.openTab('Brand kit')

    const cta = artboard(p).getByText('See your travel benefits')
    await expect(cta).toHaveCSS('border-radius', '6px')
    await s.panel.getByRole('button', { name: 'Sharp' }).click()
    await expect(cta).toHaveCSS('border-radius', '2px')
    await s.panel.getByRole('button', { name: 'Pill' }).click()
    expect(parseFloat(await css(cta, 'borderRadius'))).toBeGreaterThan(20)

    const mail = artboard(p).locator('[class*="mail"]').first()
    const at560 = await mail.evaluate((el) => el.getBoundingClientRect().width)
    await s.panel.getByRole('button', { name: '480' }).click()
    const at480 = await mail.evaluate((el) => el.getBoundingClientRect().width)
    expect(at480).toBeLessThan(at560)

    const heading = artboard(p).locator('h2').first()
    const normal = parseFloat(await css(heading, 'marginTop'))
    await s.panel.getByRole('button', { name: 'Airy', exact: true }).click()
    expect(parseFloat(await css(heading, 'marginTop'))).toBeGreaterThan(normal)
    await s.panel.getByRole('button', { name: 'Tight', exact: true }).click()
    expect(parseFloat(await css(heading, 'marginTop'))).toBeLessThan(normal)
  })

  test('the sender, footer and wordmark reach every surface', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.openTab('Brand kit')
    await s.panel.getByLabel('From name').fill('HDFC Bank Cards')
    await s.panel.getByLabel('Footer').fill('Written by the studio')
    await s.panel.getByLabel('Logo wordmark').fill('HDFC')

    // The inbox row, the notification title and the email itself all read it.
    await expect(artboard(p)).toContainText('HDFC Bank Cards')
    await s.surface('Notification · Lock screen').click()
    await expect(artboard(p)).toContainText('HDFC Bank Cards')
    await s.surface('Inbox · Apple Mail').click()
    await expect(artboard(p)).toContainText('HDFC')
    await expect(artboard(p)).toContainText('Written by the studio')

    await s.openTab('Brand kit')
    await s.panel.getByLabel('From address').fill('cards@hdfcbank.example.in')
    await s.surface('Desktop · Gmail').click()
    await expect(artboard(p)).toContainText('cards@hdfcbank.example.in')
  })

  test('the kit travels with the design, not with the studio', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    const cta = artboard(p).getByText('See your travel benefits')
    await expect(cta).toHaveCSS('background-color', 'rgb(20, 52, 203)')

    // The tenure design ships on Midnight; opening it must bring its own kit.
    await openLibrary(p)
    await p.locator('button[aria-label="Open Tenure thank-you — HNI"]').click()
    await expect(s.name).toHaveValue('Tenure thank-you — HNI')
    // Opening a design also resets the surface to that channel's default.
    await expect(s.surface('Inbox · Gmail')).toHaveAttribute('aria-pressed', 'true')
    await s.surface('Inbox · Apple Mail').click()
    const warm = artboard(p).getByText('See what is waiting')
    await expect(warm).toHaveCSS('color', 'rgb(17, 23, 38)')
  })
})

test.describe('Assets', () => {
  test('a preset with nothing selected adds a banner', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Assets')
    await expect(s.panel).toContainText('Click to add a banner')
    await s.panel.getByRole('button', { name: /Skyline/ }).click()
    await expect(s.props).toContainText('Banner')
    await expect(artboard(p).locator('[class*="bannerCity"]')).toBeVisible()
  })

  test('a preset with a banner selected swaps its artwork', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Banner' }).first().click()

    await s.openTab('Assets')
    await expect(s.panel).toContainText('Applies to the banner you have selected')
    await expect(s.panel.getByRole('button', { name: /Card art/ }))
      .toHaveAttribute('aria-pressed', 'true')

    await s.panel.getByRole('button', { name: /Points burst/ }).click()
    await expect(s.panel.getByRole('button', { name: /Points burst/ }))
      .toHaveAttribute('aria-pressed', 'true')
    await expect(artboard(p).locator('[class*="bannerPoints"]')).toBeVisible()
    await expect(artboard(p)).toContainText('bonus points')
  })

  test('the merge-field table names both cardholders', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Assets')
    await expect(s.panel).toContainText('Merge fields')
    await expect(s.panel).toContainText('Rohit')
    await expect(s.panel).toContainText('Priyadarshini')
    await expect(s.panel).toContainText('Thiruvananthapuram')
    await expect(s.panel).toContainText('₹1,48,250')
  })
})
