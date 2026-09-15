import { expect, test } from '@playwright/test'
import { artboard, openStudio, startDesign } from './helpers.js'

const blank = async (s, page) => {
  await startDesign(page)
}

test.describe('Preflight', () => {
  test('a blank email fails on the things that stop a send', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await blank(s, p)
    await s.openTab('Preflight')

    for (const say of ['No subject line', 'No button', 'No legal line']) {
      await expect(s.panel.getByText(say, { exact: true })).toBeVisible()
    }
    await expect(s.panel).toContainText(/3\s*blocking/)
    await expect(s.topbar).toContainText('3 blocking')
  })

  test('fixing a finding clears it', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await blank(s, p)
    await s.openTab('Preflight')
    await expect(s.panel.getByText('No subject line')).toBeVisible()

    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    await s.props.getByLabel('Copy').fill('Your points are ready')

    await s.openTab('Preflight')
    await expect(s.panel.getByText('No subject line')).toHaveCount(0)
    await expect(s.panel).toContainText('Subject fits every inbox')
    await expect(s.topbar).toContainText('2 blocking')
  })

  test('“Show me” takes the artboard to the surface that breaks', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Preflight')
    await expect(s.panel.getByText('Subject is cut on a phone')).toBeVisible()

    await s.panel.getByRole('button', { name: 'Show me →' }).first().click()
    await expect(s.surface('Inbox · Gmail')).toHaveAttribute('aria-pressed', 'true')
  })

  test('a malformed token is caught and a well-formed one is not', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Preflight')
    // The shipped design is full of correct tokens; none may be reported.
    await expect(s.panel.getByText('A merge token is malformed')).toHaveCount(0)

    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    await s.props.getByLabel('Copy').fill('Hi {{first_name}, your points')
    await s.openTab('Preflight')
    await expect(s.panel.getByText('A merge token is malformed')).toBeVisible()
    await expect(s.panel).toContainText('{{first_name},')
  })

  test('an unknown token is reported by name', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    await s.props.getByLabel('Copy').fill('Hi {{nickname}}, your points')
    await s.openTab('Preflight')
    await expect(s.panel.getByText('Unknown merge token')).toBeVisible()
    await expect(s.panel).toContainText('{{nickname}}')
  })

  test('the compliance rules from launch are enforced while writing', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    await s.props.getByLabel('Copy').fill('{{first_name}}, you are pre-approved — guaranteed!')
    await s.openTab('Preflight')
    await expect(s.panel).toContainText('Implies an eligibility decision that has not been made')
    await expect(s.panel).toContainText('Promises an outcome the product cannot guarantee')
  })

  test('dark mode contrast is judged against Gmail’s own ground', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Preflight')
    // The house blue is visible but under the 3:1 control floor — a warning,
    // because an operator cannot fix the brand and it does not stop a send.
    await expect(s.panel.getByText('The button barely separates in dark mode')).toBeVisible()
    await expect(s.panel).not.toContainText(/^\d+ blocking/)

    // A near-black brand is the same colour as the page. That does block.
    await s.openTab('Brand kit')
    await s.panel.getByRole('button', { name: /Midnight/ }).click()
    await s.openTab('Preflight')
    await expect(s.panel.getByText('The button disappears in dark mode')).toBeVisible()
    await expect(s.panel).toContainText('1.1:1')

    // A palette with room clears it entirely.
    await s.openTab('Brand kit')
    await s.panel.getByRole('button', { name: /Signature/ }).click()
    await s.openTab('Preflight')
    await expect(s.panel.getByText(/disappears in dark mode/)).toHaveCount(0)
  })

  test('alt text and the legal line are checked on the real stack', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.openTab('Preflight')
    await expect(s.panel).toContainText('Every image has alt text')

    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Banner' }).first().click()
    await s.props.getByLabel('Alt text').fill('')
    await s.openTab('Preflight')
    await expect(s.panel).toContainText('1 image without alt text')
    await expect(s.panel).toContainText('Gmail blocks images by default')

    await s.openTab('Layers')
    await p.locator('button[aria-label="Delete"]').last().click()
    await s.openTab('Preflight')
    await expect(s.panel.getByText('No legal line')).toBeVisible()
  })

  test('WhatsApp template rules match what Meta actually rejects', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.channel('WhatsApp').click()
    await s.openTab('Preflight')
    await expect(s.panel.getByText(/opens or closes on a variable/)).toHaveCount(0)

    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Body' }).click()
    await s.props.getByLabel('Copy').fill('{{first_name}} your points are on the {{card}}')
    await s.openTab('Preflight')
    await expect(s.panel.getByText('Template opens or closes on a variable')).toBeVisible()

    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Body' }).click()
    await s.props.getByLabel('Copy').fill('Hi {{first_name}} {{points}} are ready, from us')
    await s.openTab('Preflight')
    await expect(s.panel.getByText('Two variables with nothing between them')).toBeVisible()
  })

  test('a WhatsApp button label over twenty characters is blocked', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.channel('WhatsApp').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'See benefits' }).click()
    await s.props.getByLabel('Label').fill('See absolutely all of your benefits now')
    await s.openTab('Preflight')
    await expect(s.panel.getByText('Button label over 20 characters')).toBeVisible()
  })

  test('SMS encoding and segments are reported where they cost money', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.channel('SMS').click()
    await s.openTab('Preflight')
    await expect(s.panel.getByText('Message dropped to UCS-2')).toBeVisible()
    await expect(s.panel).toContainText('Segment size falls from 160 to 70')

    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Body' }).click()
    await s.props.getByLabel('Copy').fill('{{first_name}}, 5,000 points added. vsa.in/tr STOP to opt out')
    await s.openTab('Preflight')
    await expect(s.panel.getByText('Message dropped to UCS-2')).toHaveCount(0)
    await expect(s.panel).toContainText('One segment')
    await expect(s.topbar).toContainText('Clear')
  })

  test('the rail flags a blocking finding without opening the panel', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await blank(s, p)
    await s.openTab('Layers')
    const dot = s.rail.getByRole('button', { name: 'Preflight' }).locator('i')
    await expect(dot).toBeVisible()

    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    await s.props.getByLabel('Copy').fill('Points ready')
    await s.openTab('Templates')
    await p.getByRole('button', { name: /Benefit reminder/ }).click()
    await p.getByRole('button', { name: 'Use this layout' }).click()
    await expect(dot).toHaveCount(0)
  })

  test('the checks read the artboard, not a cached copy', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Preflight')
    await expect(s.panel).toContainText('One clear action')

    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: /See your travel benefits/ }).click()
    await p.keyboard.press('Meta+d')
    await p.keyboard.press('Meta+d')
    await s.openTab('Preflight')
    await expect(s.panel.getByText('3 buttons')).toBeVisible()
    await expect(artboard(p).getByText('See your travel benefits')).toHaveCount(3)
  })
})
