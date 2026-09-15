import { expect, test } from '@playwright/test'
import { artboard, startDesign, studio } from './helpers.js'

const open = async (page) => {
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('/pm/studio/new')
  await expect(page.getByRole('heading', { name: 'New design' })).toBeVisible()
  return errors
}

const layouts = (page) => page.locator('button[aria-label^="Start from "]')

test.describe('New design', () => {
  test('opens on a button, not a catalogue', async ({ page }) => {
    await open(page)
    await expect(page.getByRole('button', { name: 'Start a new design' })).toBeVisible()
    await expect(layouts(page)).toHaveCount(0)
    await expect(page.getByText('Blank design')).toHaveCount(0)
    await expect(page.getByRole('group', { name: 'Preview channel' })).toHaveCount(0)
  })

  test('the button reveals the layouts', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'Start a new design' }).click()

    await expect(page.getByText('Blank design')).toBeVisible()
    await expect(layouts(page)).toHaveCount(10)
    await expect(page.getByRole('group', { name: 'Preview channel' })).toBeVisible()
    // Each layout carries what its shape has done before.
    await expect(page.getByText('Benefit reminder')).toBeVisible()
    await expect(page.locator('body')).toContainText('34.0%')
  })

  test('the channel toggle repaints the previews', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'Start a new design' }).click()
    const chan = page.getByRole('group', { name: 'Preview channel' })
    await expect(chan.getByRole('button', { name: 'Email' })).toHaveAttribute('aria-pressed', 'true')

    await chan.getByRole('button', { name: 'WhatsApp' }).click()
    await expect(chan.getByRole('button', { name: 'WhatsApp' })).toHaveAttribute('aria-pressed', 'true')
    await expect(chan.getByRole('button', { name: 'Email' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('blank opens an empty document in the editor', async ({ page }) => {
    const s = await startDesign(page)
    await expect(page).toHaveURL(/\/pm\/studio\?design=/)
    await expect(s.name).toHaveValue('Untitled design')
    await expect(s.state).toHaveValue('draft')
    await expect(page.getByText('Nothing on the artboard yet')).toBeVisible()
  })

  test('a layout opens with its copy on all three channels', async ({ page }) => {
    const s = await startDesign(page, 'Expiry notice')
    await expect(s.name).toHaveValue('Expiry notice')

    await s.surface('Inbox · Apple Mail').click()
    await expect(artboard(page)).toContainText('expires on 31 October')
    await s.channel('WhatsApp').click()
    await expect(artboard(page)).toContainText('Closes 31 October')
    await s.channel('SMS').click()
    await expect(artboard(page)).toContainText('expires 31 October')
  })

  test('what it makes turns up in the library', async ({ page }) => {
    const s = await startDesign(page, 'Tenure thank-you')
    await s.name.fill('October relationship push')
    await expect(s.topbar).toContainText(/Saved /)

    await page.goto('/pm/studio/designs')
    await expect(studio(page).cards().first()).toContainText('October relationship push')
    await expect(studio(page).cards()).toHaveCount(10)
  })

  test('starting a design never throws', async ({ page }) => {
    const errors = await open(page)
    await page.getByRole('button', { name: 'Start a new design' }).click()
    await page.getByRole('button', { name: 'Start from Three reasons' }).click()
    await expect(page.getByLabel('Design name')).toBeVisible()
    expect(errors).toEqual([])
  })
})
