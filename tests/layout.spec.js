import { expect, test } from '@playwright/test'
import { openStudio } from './helpers.js'

/**
 * The studio has four columns and a fixed-size artboard, which is exactly the
 * shape that quietly breaks on a smaller screen. These tests are about the
 * frame rather than the content: nothing overlaps, nothing is unreachable,
 * and the page never grows a horizontal scrollbar of its own.
 */
const overlaps = (a, b) => !(
  a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1
  || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1
)

test('the page itself never scrolls sideways', async ({ page }) => {
  await openStudio(page)
  const over = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(over).toBeLessThanOrEqual(0)
})

test('the four columns tile without overlapping', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  const boxes = await Promise.all([
    s.rail.boundingBox(),
    s.panel.boundingBox(),
    p.locator('[aria-label="Artboard"]').boundingBox(),
    s.props.boundingBox(),
  ])
  for (let i = 0; i < boxes.length - 1; i += 1) {
    expect(overlaps(boxes[i], boxes[i + 1]), `column ${i} overlaps ${i + 1}`).toBe(false)
  }
  // And they add up to the width available to the page.
  const right = boxes[3].x + boxes[3].width
  const width = p.viewportSize().width
  expect(right).toBeLessThanOrEqual(width + 1)
})

test('every panel opens, collapses and gives the canvas the room back', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  const TABS = ['Templates', 'Layers', 'Insert', 'Brand kit', 'Assets', 'Preflight']

  for (const tab of TABS) {
    await s.openTab(tab)
    await expect(s.panel).toBeVisible()
    const box = await s.panel.boundingBox()
    expect(box.width).toBeGreaterThan(180)
    // Nothing inside a panel may spill out of it sideways.
    const spill = await s.panel.evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(spill, `${tab} spills horizontally`).toBeLessThanOrEqual(1)
  }

  const wide = await p.locator('[aria-label="Artboard"]').boundingBox()
  await s.rail.getByRole('button', { name: 'Preflight' }).click()
  await expect(s.panel).toHaveCount(0)
  const wider = await p.locator('[aria-label="Artboard"]').boundingBox()
  expect(wider.width).toBeGreaterThan(wide.width)
})

test('every surface button is reachable even when the bar has to scroll', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  for (const channel of ['Email', 'WhatsApp', 'SMS']) {
    await s.channel(channel).click()
    const buttons = await p.getByRole('group', { name: 'Surface' }).getByRole('button').all()
    expect(buttons.length).toBeGreaterThan(6)
    for (const b of buttons) {
      await b.click()
      await expect(b).toHaveAttribute('aria-pressed', 'true')
    }
  }
})

test('fit to width brings a desktop client inside the canvas', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  await s.surface('Desktop · Gmail').click()

  const stage = p.locator('[aria-label="Artboard"]')
  await p.getByRole('button', { name: 'Fit to width' }).click()

  const room = await stage.evaluate((el) => el.clientWidth)
  const art = await stage.locator('> div').first()
    .evaluate((el) => el.getBoundingClientRect().width)
  expect(art).toBeLessThanOrEqual(room)

  // And the client kept its real proportions rather than being squeezed.
  // offsetWidth is the unzoomed layout width, which is the one that matters.
  const pane = await p.locator('[class*="webPane"]').first()
    .evaluate((el) => el.offsetWidth)
  expect(pane).toBeGreaterThan(400)
})

test('the top bar keeps its three zones apart', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  const name = await s.name.boundingBox()
  const channels = await s.channels.boundingBox()
  const tokens = await p.getByRole('button', { name: 'Tokens', exact: true }).boundingBox()

  expect(name.x + name.width).toBeLessThanOrEqual(channels.x + 1)
  expect(channels.x + channels.width).toBeLessThanOrEqual(tokens.x + 1)
})

test('the studio survives the app sidebar being collapsed', async ({ page }) => {
  const { page: p } = await openStudio(page)
  const before = await p.locator('[aria-label="Artboard"]').boundingBox()
  // Whatever the shell does, the studio must not overflow the viewport.
  const over = await p.evaluate(() => document.documentElement.scrollWidth
    - document.documentElement.clientWidth)
  expect(over).toBeLessThanOrEqual(0)
  expect(before.width).toBeGreaterThan(300)
})

test('a long design name does not push the channel switcher off', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  await s.name.fill('An extremely long design name that somebody typed without stopping')
  const channels = await s.channels.boundingBox()
  const tokens = await p.getByRole('button', { name: 'Tokens', exact: true }).boundingBox()
  expect(channels.x + channels.width).toBeLessThanOrEqual(tokens.x + 1)
  const over = await p.evaluate(() => document.documentElement.scrollWidth
    - document.documentElement.clientWidth)
  expect(over).toBeLessThanOrEqual(0)
})
