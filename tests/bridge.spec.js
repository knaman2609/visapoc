import { expect, test } from '@playwright/test'
import { studio } from './helpers.js'

/**
 * The join between the two screens: a creative is designed and judged in the
 * studio, then reused by a campaign. These tests are about that seam — that
 * the flow can see the library, that applying one really replaces the copy on
 * every channel it covers, and that the provenance it claims stays true.
 */
const openStep = async (page) => {
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('/pm/flow/4')
  await expect(page.getByRole('button', { name: /Use a design from the studio/ }))
    .toBeVisible({ timeout: 25_000 })
  return errors
}

const bar = (page) => page.locator('[class*="source_"]').first()
const pick = (page, name) => page.getByRole('dialog').getByRole('button', { name: `Use ${name}` })

test.describe('Studio → campaign', () => {
  test('the step offers the library and says what it is writing from', async ({ page }) => {
    await openStep(page)
    await expect(bar(page)).toContainText('Writing from the house templates')
  })

  test('the picker ranks by what worked and shows channel coverage', async ({ page }) => {
    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('This campaign is going out on Email, WhatsApp and SMS')

    // Best click rate first, so reuse is a decision with evidence behind it.
    const rows = dialog.locator('button[aria-label^="Use "]')
    await expect(rows.first()).toContainText('Expiry — 14 day push')
    await expect(rows.first()).toContainText('11.3%')
    await expect(rows.first()).toContainText('61,200 sent')
    // Every seeded design is written for all three channels.
    await expect(rows.first()).toContainText('Email')
    await expect(rows.first()).toContainText('WhatsApp')
    await expect(rows.first()).toContainText('SMS')
    // Ones that never shipped come after the ones that did.
    await expect(rows.last()).toContainText('Never sent')
  })

  test('applying a design replaces the copy on every channel it covers', async ({ page }) => {
    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    await pick(page, 'Expiry — 14 day push').click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const art = page.locator('[class*="cardBody"]').first()
    await expect(art).toContainText('expires on')

    await page.getByRole('button', { name: 'WhatsApp' }).first().click()
    await expect(art).toContainText('expires')
    await page.getByRole('button', { name: 'SMS' }).first().click()
    await expect(art).toContainText('vsa.in/tr')
  })

  test('the email preview draws the real design, not a paraphrase of it', async ({ page }) => {
    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    await pick(page, 'Expiry — 14 day push').click()

    // The countdown block, the logo lock-up and the brand sender all come
    // from the studio document rather than from this step's plain card.
    const art = page.locator('[class*="cardBody"]').first()
    await expect(art).toContainText('days')
    await expect(art).toContainText('hours')
    await expect(art).toContainText('Ending soon')
    await expect(art).toContainText('cards@visa.example.co.in')
  })

  test('the step reports the provenance and the number behind it', async ({ page }) => {
    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    await pick(page, 'October benefit sweep').click()

    await expect(bar(page)).toContainText('October benefit sweep')
    await expect(bar(page)).toContainText('All 3 channels')
    await expect(bar(page)).toContainText('6.8%')
    await expect(bar(page)).toContainText('1,28,400')
  })

  test('editing keeps the words and drops the claim', async ({ page }) => {
    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    await pick(page, 'October benefit sweep').click()
    await expect(bar(page)).toContainText('6.8%')

    await page.getByRole('button', { name: 'Edit the copy by hand' }).click()
    await page.locator('[class*="editable"]').first().fill('An edited subject line')

    await expect(bar(page)).toContainText('edited here')
    // The click rate belonged to the creative, not to an edit of it.
    await expect(bar(page)).not.toContainText('6.8%')
    await expect(bar(page)).toContainText('October benefit sweep')
  })

  test('back to drafted returns the house template', async ({ page }) => {
    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    await pick(page, 'Expiry — 14 day push').click()
    await expect(bar(page)).toContainText('Expiry — 14 day push')

    await page.getByRole('button', { name: 'Back to drafted' }).click()
    await expect(bar(page)).toContainText('Writing from the house templates')
    // The design's own furniture is gone, not just its words.
    await expect(page.locator('[class*="cardBody"]').first()).not.toContainText('Ending soon')
    await expect(page.locator('[class*="cardBody"]').first())
      .toContainText('points bonus points are on your card')
  })

  test('change swaps one design for another', async ({ page }) => {
    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    await pick(page, 'Expiry — 14 day push').click()
    await page.getByRole('button', { name: 'Change', exact: true }).click()
    await pick(page, 'Tenure thank-you — HNI').click()
    await expect(bar(page)).toContainText('Tenure thank-you — HNI')
    await expect(bar(page)).toContainText('4.7%')
  })

  test('a design made in the studio turns up in the campaign', async ({ page }) => {
    // The whole point of the seam: make it there, use it here.
    await page.goto('/pm/studio')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
    const s = studio(page)
    await expect(s.name).toBeVisible()
    await s.name.fill('Made for the October push')
    await expect(s.topbar).toContainText(/Saved /)

    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    await expect(page.getByRole('dialog')).toContainText('Made for the October push')
    await pick(page, 'Made for the October push').click()
    await expect(bar(page)).toContainText('Made for the October push')
  })

  test('a design that covers only one channel leaves the rest as drafted', async ({ page }) => {
    // Empty the WhatsApp and SMS sides of a design, then reuse it.
    await page.goto('/pm/studio')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
    const s = studio(page)
    await expect(s.name).toBeVisible()
    await s.name.fill('Email only')

    for (const channel of ['WhatsApp', 'SMS']) {
      await s.channel(channel).click()
      await s.openTab('Layers')
      if (channel === 'WhatsApp') {
        for (const part of ['Header', 'Body', 'Footer']) {
          await s.panel.getByRole('button', { name: part }).click()
          await s.props.getByLabel('Copy').fill('')
        }
        await page.locator('button[aria-label="Remove button"]').first().click()
      } else {
        await s.panel.getByRole('button', { name: 'Body' }).click()
        await s.props.getByLabel('Copy').fill('')
      }
    }
    await expect(s.topbar).toContainText(/Saved /)

    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    const row = page.getByRole('dialog').locator('button[aria-label="Use Email only"]')
    await expect(row).toContainText('no WhatsApp')
    await expect(row).toContainText('no SMS')
    await row.click()

    await expect(bar(page)).toContainText('Email only')
    await expect(bar(page)).toContainText('WhatsApp and SMS as drafted')
  })

  test('the picker can hide designs that do not fit', async ({ page }) => {
    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    const dialog = page.getByRole('dialog')
    const fits = dialog.getByRole('button', { name: 'Only what fits' })
    await expect(fits).toHaveAttribute('aria-pressed', 'true')
    await fits.click()
    await expect(dialog.getByRole('button', { name: 'Everything' })).toBeVisible()
  })

  test('a modal is modal — the agent panel cannot swallow its clicks', async ({ page }) => {
    await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // The agent panel is fixed and floats over the page. It must sit under a
    // modal: on a laptop the two overlap, and at --z-toast it took the clicks
    // aimed at the picker.
    for (const name of ['Only what fits', 'Close']) {
      const target = dialog.getByRole('button', { name })
      const box = await target.boundingBox()
      const topmost = await page.evaluate(([x, y]) => {
        const el = document.elementFromPoint(x, y)
        return !!el?.closest('[role="dialog"]')
      }, [box.x + box.width / 2, box.y + box.height / 2])
      expect(topmost, `${name} is covered by something outside the dialog`).toBe(true)
    }
  })

  test('the seam never throws', async ({ page }) => {
    const errors = await openStep(page)
    await page.getByRole('button', { name: /Use a design from the studio/ }).click()
    for (const name of ['Expiry — 14 day push', 'SMS — one segment', 'Benefits statement']) {
      await pick(page, name).click()
      await page.getByRole('button', { name: 'Change', exact: true }).click()
    }
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
    expect(errors).toEqual([])
  })
})
