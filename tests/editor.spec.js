import { expect, test } from '@playwright/test'
import { artboard, openStudio, startDesign } from './helpers.js'

const layerRows = (page) => page.getByRole('complementary', { name: 'Studio panel' })
  .locator('[draggable="true"]')

/** A palette row reads as its name plus its hint, so match on the name only. */
const insert = (s, kind) => s.panel
  .getByRole('button', { name: new RegExp(`^${kind}`) }).click()

test.describe('Layers', () => {
  test('lists the stack, plus the subject and preheader', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.openTab('Layers')
    await expect(s.panel.getByRole('button', { name: 'Subject' })).toBeVisible()
    await expect(s.panel.getByRole('button', { name: 'Preheader' })).toBeVisible()
    await expect(layerRows(p)).toHaveCount(6)
    // Names come from the merged copy, not from the raw tokens.
    await expect(s.panel).toContainText('Rohit, 5,000 bonus points')
  })

  test('flags a preheader nobody wrote', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Layers')
    await expect(s.panel.getByTitle(/Not set/)).toHaveCount(0)

    await startDesign(page)
    await s.openTab('Layers')
    await expect(s.panel.getByTitle(/Not set/)).toBeVisible()
  })

  test('selecting on the artboard selects in the rail, and back', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Layers')

    const heading = artboard(p).locator('[role="button"][aria-pressed]')
      .filter({ hasText: 'bonus points are on' }).first()
    await heading.click()
    await expect(heading).toHaveAttribute('aria-pressed', 'true')
    await expect(s.props).toContainText('Heading')

    // Escape clears it everywhere.
    await p.keyboard.press('Escape')
    await expect(s.props).toContainText('Nothing selected')
    await expect(heading).toHaveAttribute('aria-pressed', 'false')
  })

  test('duplicate and delete from the rail', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.openTab('Layers')
    await p.locator('button[aria-label="Duplicate"]').first().click()
    await expect(layerRows(p)).toHaveCount(7)
    await p.locator('button[aria-label="Delete"]').first().click()
    await expect(layerRows(p)).toHaveCount(6)
  })

  test('a block can be inserted into the middle of the stack', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.openTab('Layers')
    const gap = s.panel.locator('button[aria-label="Insert a block at position 2"]')
    await gap.click({ force: true })
    await s.panel.getByRole('button', { name: 'Divider', exact: true }).click()
    await expect(layerRows(p)).toHaveCount(7)
    await expect(s.props).toContainText('Divider')
  })
})

test.describe('Insert palette', () => {
  const KINDS = [
    'Logo lock-up', 'Banner', 'Heading', 'Paragraph', 'Bullets', 'Stat band',
    'Offer card', 'Countdown', 'Two columns', 'Button', 'Text link',
    'Divider', 'Space', 'Legal line',
  ]

  test('adds every block kind and the artboard draws each one', async ({ page }) => {
    const { s, page: p, errors } = await openStudio(page)
    await startDesign(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Insert')

    for (const kind of KINDS) {
      await insert(s, kind)
    }
    await s.openTab('Layers')
    await expect(layerRows(p)).toHaveCount(KINDS.length)

    // Each one drew something rather than throwing.
    const board = artboard(p)
    await expect(board).toContainText('Visa Cards')
    await expect(board).toContainText('A short, specific headline')
    await expect(board).toContainText('Say the one thing that matters')
    await expect(board).toContainText('bonus points, credited today')
    await expect(board).toContainText('unclaimed travel value')
    await expect(board).toContainText('Lounge access')
    await expect(board).toContainText('See your benefits')
    await expect(board).toContainText('Read the full terms')
    await expect(board).toContainText('days')
    await expect(board).toContainText('Terms apply')
    expect(errors).toEqual([])
  })

  test('the palette says blocks are an email idea', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.channel('WhatsApp').click()
    await s.openTab('Insert')
    await expect(s.panel).toContainText('Blocks are an email idea')
  })
})

test.describe('Properties', () => {
  test('typing keeps the caret and lands every character', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()

    const box = s.props.getByLabel('Copy')
    await box.fill('')
    await box.pressSequentially('Rohit, act now')
    // The regression: a component declared inside render remounts on every
    // keystroke, so only the last character survives and focus is lost.
    await expect(box).toHaveValue('Rohit, act now')
    await expect(box).toBeFocused()
  })

  test('the subject meter counts down per client and goes red when over', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    await expect(s.props).toContainText('Where it gets cut')

    const box = s.props.getByLabel('Copy')
    await box.fill('Short one')
    await expect(s.props).toContainText('24 left')
    await expect(s.props).toContainText('55 left')

    await box.fill('A subject line that is far too long to survive a handset inbox row')
    await expect(s.props).toContainText('−33')
  })

  test('a merge field lands at the caret', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()

    const box = s.props.getByLabel('Copy')
    await box.fill('Hi , your points')
    await box.click()
    await box.press('Home')
    for (let i = 0; i < 3; i += 1) await box.press('ArrowRight')
    await s.props.getByRole('button', { name: 'first_name' }).click()
    await expect(box).toHaveValue('Hi {{first_name}}, your points')
  })

  test('per-block controls change what the artboard draws', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: /Rohit, 5,000 bonus points/ }).first().click()

    await s.props.getByRole('button', { name: 'Centre' }).click()
    const heading = artboard(p).locator('h2').first()
    await expect(heading).toHaveCSS('text-align', 'center')

    const before = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    await s.props.getByRole('button', { name: 'S', exact: true }).click()
    const after = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(after).toBeLessThan(before)
  })

  test('a bullets block edits its own items', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Insert')
    await insert(s, 'Bullets')

    await expect(s.props.getByRole('textbox', { name: 'Item 1', exact: true })).toBeVisible()
    await s.props.getByRole('textbox', { name: 'Item 2', exact: true }).fill('A second thing entirely')
    await expect(artboard(p)).toContainText('A second thing entirely')

    await s.props.getByRole('button', { name: 'Add an item' }).click()
    await expect(s.props.getByRole('textbox', { name: 'Item 4', exact: true })).toBeVisible()
    await s.props.getByRole('button', { name: 'Remove item 1' }).click()
    await expect(s.props.getByRole('textbox', { name: 'Item 4', exact: true })).toHaveCount(0)
  })

  test('the countdown slider drives the tiles', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Insert')
    await insert(s, 'Countdown')
    await expect(artboard(p)).toContainText('14')
    await s.props.getByLabel('Days remaining').fill('3')
    await expect(artboard(p)).toContainText('03')
  })

  test('nothing selected shows the document and the rewrites', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await expect(s.props).toContainText('Nothing selected')
    await expect(s.props).toContainText('Blocks')
    await expect(s.props).toContainText('Words')
    await expect(s.props).toContainText('7.4% acted on · 79% rated helpful')

    await s.surface('Inbox · Apple Mail').click()
    await s.props.getByRole('button', { name: /Warmer/ }).click()
    await expect(artboard(p)).toContainText('a thank-you for 4 years with us')
  })
})

test.describe('Keyboard', () => {
  test('duplicate, delete, move and undo', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: /Rohit, 5,000 bonus points/ }).first().click()

    await p.keyboard.press('Meta+d')
    await expect(layerRows(p)).toHaveCount(7)
    await p.keyboard.press('Delete')
    await expect(layerRows(p)).toHaveCount(6)
    await p.keyboard.press('Meta+z')
    await expect(layerRows(p)).toHaveCount(7)
    await p.keyboard.press('Meta+Shift+z')
    await expect(layerRows(p)).toHaveCount(6)
  })

  test('arrows walk the stack and modifier-arrows reorder it', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Visa Cards' }).first().click()
    await expect(s.props).toContainText('Logo lock-up')

    await p.keyboard.press('ArrowDown')
    await expect(s.props).toContainText('Banner')
    await p.keyboard.press('ArrowUp')
    await expect(s.props).toContainText('Logo lock-up')

    const first = () => layerRows(p).first().innerText()
    expect(await first()).toContain('Visa Cards')
    await p.keyboard.press('Meta+ArrowDown')
    expect(await first()).not.toContain('Visa Cards')
  })

  test('typing is never intercepted by the shortcuts', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    const box = s.props.getByLabel('Copy')
    await box.fill('dd')
    await box.press('Backspace')
    await expect(box).toHaveValue('d')
    // Backspace edited the field rather than deleting the selected layer, and
    // the arrow keys did not walk the stack out from under the caret.
    await box.press('ArrowUp')
    await expect(s.props).toContainText('Subject line')
    await expect(box).toBeFocused()
  })
})

test.describe('Messaging channels', () => {
  test('WhatsApp exposes the template parts and its buttons', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.channel('WhatsApp').click()
    await s.openTab('Layers')

    await expect(s.panel.getByRole('button', { name: 'Header' })).toBeVisible()
    await expect(s.panel.getByRole('button', { name: 'Body' })).toBeVisible()
    await expect(s.panel.getByRole('button', { name: 'Footer' })).toBeVisible()

    await s.panel.getByRole('button', { name: 'Header' }).click()
    await s.props.getByLabel('Copy').fill('Benefits update')
    await expect(artboard(p)).toContainText('Benefits update')
    await expect(s.props).toContainText('15/60')

    await s.panel.getByRole('button', { name: 'See benefits' }).click()
    await expect(s.props).toContainText('Button 1')
    await s.props.getByLabel('Label').fill('Open the app')
    await expect(artboard(p)).toContainText('Open the app')

    await s.panel.getByRole('button', { name: 'Add a button' }).click()
    await s.panel.getByRole('button', { name: 'Add a button' }).click()
    await expect(s.panel.getByRole('button', { name: 'Add a button' })).toHaveCount(0)

    await p.locator('button[aria-label="Remove button"]').first().click()
    await expect(s.panel.getByRole('button', { name: 'Add a button' })).toBeVisible()
  })

  test('SMS shows what the message actually bills', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.channel('SMS').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Body' }).click()

    // The rupee sign is not in GSM-7, so this one bills on UCS-2.
    await expect(s.props).toContainText('UCS-2')
    await expect(s.props).toContainText(/2\s*segments/)

    await s.props.getByLabel('Copy').fill('Points added. See vsa.in/tr for details.')
    await expect(s.props).toContainText('GSM-7')
    await expect(s.props).toContainText(/1\s*segment/)
  })
})

test.describe('Empty documents', () => {
  // A new design starts empty on all three channels. Drawing the artefact
  // anyway gave WhatsApp a white sliver with a lone timestamp in it, which
  // reads as a broken renderer rather than as a document nobody has written.
  // `absent` is the artefact itself. The client's own chrome stays — an empty
  // Apple Mail still draws its nav bar and sender row — but nothing that
  // implies a message was written may appear.
  const CASES = [
    ['Email', 'Inbox · Apple Mail', 'Nothing on the artboard yet', 'Add a heading',
      'Sent to the address on file'],
    ['WhatsApp', 'Thread · Chat', 'No message yet', 'Write the body', '09:00'],
    ['SMS', 'Thread · Thread', 'No message yet', 'Write the message', 'Today 9:00 AM'],
  ]

  for (const [channel, surface, title, action, absent] of CASES) {
    test(`${channel}: a blank document offers a way in, not an empty artefact`, async ({ page }) => {
      const { s, page: p } = await openStudio(page)
      await startDesign(page)
      if (channel !== 'Email') await s.channel(channel).click()
      await s.surface(surface).click()

      await expect(p.getByText(title)).toBeVisible()
      await expect(p.getByRole('button', { name: action })).toBeVisible()
      await expect(p.getByRole('button', { name: 'Start from a layout' })).toBeVisible()

      await expect(artboard(p).locator('[class*="Bubble"], [class*="bubble"]')).toHaveCount(0)
      await expect(artboard(p)).not.toContainText(absent)
    })
  }

  test('the way-in button lands on the right field', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await startDesign(page)
    await s.channel('WhatsApp').click()
    await p.getByRole('button', { name: 'Write the body' }).click()
    await expect(s.props).toContainText('Message')

    await s.props.getByLabel('Copy').fill('Hi Rohit, your points are ready.')
    await expect(artboard(p)).toContainText('Hi Rohit, your points are ready.')
    await expect(p.getByText('No message yet')).toHaveCount(0)
  })

  test('the lists say there is no message rather than showing a blank row', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await startDesign(page)

    await s.channel('WhatsApp').click()
    await s.surface('Thread · Chat list').click()
    await expect(artboard(p)).toContainText('No message yet')

    await s.channel('SMS').click()
    await s.surface('Thread · Thread list').click()
    await expect(artboard(p)).toContainText('No message yet')
  })

  test('an empty document still renders every surface without erroring', async ({ page }) => {
    const { s, errors } = await openStudio(page)
    await startDesign(page)

    for (const channel of ['Email', 'WhatsApp', 'SMS']) {
      await s.channel(channel).click()
      const buttons = await page.getByRole('group', { name: 'Surface' })
        .getByRole('button').all()
      for (const b of buttons) await b.click()
    }
    expect(errors).toEqual([])
  })
})
