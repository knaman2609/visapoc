import { expect, test } from '@playwright/test'
import { artboard, openLibrary, openStudio, startDesign } from './helpers.js'

const insert = (s, kind) => s.panel
  .getByRole('button', { name: new RegExp(`^${kind}`) }).click()

test.describe('Content the studio has to survive', () => {
  test('an unbroken word does not burst the phone', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    await s.props.getByLabel('Copy').fill('Supercalifragilisticexpialidociousbenefitsprogrammerenewalnotice')

    for (const view of ['Inbox · Gmail', 'Notification · Lock screen', 'Notification · Watch']) {
      await s.surface(view).click()
      const frame = artboard(p).locator('[class*="bezel"], [class*="watchScreen"]').first()
      await expect(frame).toBeVisible()
      const spill = await frame.evaluate((el) => el.scrollWidth - el.clientWidth)
      expect(spill, `${view} spills`).toBeLessThanOrEqual(1)
    }
  })

  test('markup in the copy is drawn, never interpreted', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: /Rohit, 5,000 bonus points/ }).first().click()
    await s.props.getByLabel('Copy').fill('<script>alert(1)</script> & <b>bold</b>')

    await expect(artboard(p)).toContainText('<script>alert(1)</script> & <b>bold</b>')
    await expect(artboard(p).locator('script')).toHaveCount(0)
    await expect(artboard(p).locator('h2 b')).toHaveCount(0)
  })

  test('emoji and newlines are handled where they cost money', async ({ page }) => {
    const { s } = await openStudio(page)
    await s.channel('SMS').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Body' }).click()
    await s.props.getByLabel('Copy').fill('Points added 🎉 use them soon')
    await expect(s.props).toContainText('UCS-2')

    await s.props.getByLabel('Copy').fill('Points added.\nUse them soon.')
    await expect(s.props).toContainText('GSM-7')
  })

  test('every block kind survives having its copy emptied', async ({ page }) => {
    const { s, page: p, errors } = await openStudio(page)
    await startDesign(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Insert')

    for (const kind of ['Logo lock-up', 'Heading', 'Paragraph', 'Stat band', 'Offer card',
      'Two columns', 'Button', 'Text link', 'Legal line']) {
      await insert(s, kind)
      const boxes = await s.props.locator('textarea').all()
      for (const b of boxes) await b.fill('')
    }
    // Nothing threw, and the artboard is still a document rather than a crash.
    await expect(artboard(p)).toBeVisible()
    expect(errors).toEqual([])
  })

  test('a long stack still renders and stays selectable', async ({ page }) => {
    const { s, page: p, errors } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: /Rohit, 5,000 bonus points/ }).first().click()
    for (let i = 0; i < 25; i += 1) await p.keyboard.press('Meta+d')

    await expect(s.panel.locator('[draggable="true"]')).toHaveCount(31)
    await expect(artboard(p).locator('h2')).toHaveCount(26)
    expect(errors).toEqual([])
  })

  test('the WhatsApp button ceiling holds and each kind draws', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.channel('WhatsApp').click()
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Add a button' }).click()
    await s.panel.getByRole('button', { name: 'Add a button' }).click()
    await expect(s.panel.getByRole('button', { name: 'Add a button' })).toHaveCount(0)

    await s.panel.getByRole('button', { name: 'See benefits' }).click()
    await s.props.getByRole('button', { name: 'Call' }).click()
    await expect(artboard(p).locator('[class*="waButton_"]')).toHaveCount(3)
  })

  test('flipping channels and surfaces quickly never throws', async ({ page }) => {
    const { s, errors } = await openStudio(page)
    for (let i = 0; i < 3; i += 1) {
      for (const c of ['WhatsApp', 'SMS', 'Email']) {
        await s.channel(c).click()
        await s.surface('Notification · Lock screen').click()
        await s.surface('Notification · Watch').click()
      }
    }
    expect(errors).toEqual([])
  })
})

test.describe('Reachable by keyboard and by name', () => {
  test('every control in the studio has an accessible name', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    const TABS = ['Templates', 'Layers', 'Insert', 'Brand kit', 'Assets', 'Preflight']

    for (const tab of TABS) {
      await s.openTab(tab)
      const nameless = await p.evaluate(() => {
        // An accessible name can come from the element, from aria-labelledby,
        // or from a <label> that wraps or points at it.
        const named = (el) => {
          const own = (el.getAttribute('aria-label') || '').trim()
            || (el.textContent || '').trim()
            || (el.getAttribute('title') || '').trim()
          if (own) return true
          const by = el.getAttribute('aria-labelledby')
          if (by && document.getElementById(by)?.textContent.trim()) return true
          if (el.closest('label')?.textContent.trim()) return true
          if (el.id && document.querySelector(`label[for="${el.id}"]`)) return true
          return false
        }
        return [...document.querySelectorAll('button, select, input, textarea')]
          .filter((el) => el.offsetParent !== null && !named(el))
          .map((el) => `${el.tagName}.${el.className}`)
      })
      expect(nameless, `unnamed controls with ${tab} open`).toEqual([])
    }
  })

  test('the panel rail and the surface bar are landmarks with names', async ({ page }) => {
    const { s } = await openStudio(page)
    await expect(s.rail).toHaveAttribute('aria-label', 'Studio panels')
    await expect(s.panel).toHaveAttribute('aria-label', 'Studio panel')
    await expect(s.props).toHaveAttribute('aria-label', 'Properties')
    await expect(s.channels).toHaveAttribute('aria-label', 'Channel')
    await expect(s.surfaces).toHaveAttribute('aria-label', 'Surface')
  })

  test('toggles report their state rather than only looking pressed', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await expect(s.channel('Email')).toHaveAttribute('aria-pressed', 'true')
    await expect(s.channel('SMS')).toHaveAttribute('aria-pressed', 'false')

    const tokens = p.getByRole('button', { name: 'Tokens', exact: true })
    await expect(tokens).toHaveAttribute('aria-pressed', 'false')
    await tokens.click()
    await expect(tokens).toHaveAttribute('aria-pressed', 'true')

    await s.openTab('Brand kit')
    await expect(s.panel.getByRole('button', { name: /Visa Nova/ }))
      .toHaveAttribute('aria-pressed', 'true')
  })

  test('the artboard can be driven from the keyboard alone', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.surface('Inbox · Apple Mail').click()
    const heading = artboard(p).locator('[role="button"][aria-pressed]')
      .filter({ hasText: 'bonus points are on' }).first()
    await heading.focus()
    await p.keyboard.press('Enter')
    await expect(heading).toHaveAttribute('aria-pressed', 'true')
    await expect(s.props).toContainText('Heading')
  })
})

test.describe('States nobody designs for', () => {
  test('an empty subject is named by the client, not left blank', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await startDesign(page)

    await s.surface('Inbox · Gmail').click()
    await expect(artboard(p)).toContainText('(no subject)')
    await s.surface('Inbox · Gmail, open').click()
    await expect(artboard(p)).toContainText('(no subject)')
    await s.surface('Desktop · Gmail').click()
    await expect(artboard(p)).toContainText('(no subject)')
    await s.surface('Inbox · Apple Mail').click()
    await expect(artboard(p)).toContainText('No Subject')

    // And it goes away the moment there is one.
    await s.openTab('Layers')
    await s.panel.getByRole('button', { name: 'Subject' }).click()
    await s.props.getByLabel('Copy').fill('Your points are ready')
    await expect(artboard(p)).not.toContainText('No Subject')
  })

  test('a design with its name cleared is still findable', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await s.name.fill('')
    await expect(s.topbar).toContainText(/Saved /)
    await openLibrary(p)
    await expect(s.cards().first()).toContainText('Untitled design')
    await expect(p.locator('button[aria-label="Open Untitled design"]')).toBeVisible()
  })

  test('deleting the last design leaves a working studio', async ({ page }) => {
    const { s, page: p } = await openLibrary(page)
    for (let i = 0; i < 9; i += 1) {
      await p.locator('button[aria-label="Delete"]').first().click()
      await p.locator('button[aria-label="Confirm delete"]').click()
    }
    await expect(s.cards()).toHaveCount(0)

    // The editor makes itself a document rather than sitting on nothing.
    const errors = []
    p.on('pageerror', (e) => errors.push(String(e)))
    await p.goto('/pm/studio')
    await expect(s.name).toHaveValue('Untitled design')
    await expect(p.getByText('Nothing on the artboard yet')).toBeVisible()
    await openLibrary(p)
    await expect(s.cards()).toHaveCount(1)
    expect(errors).toEqual([])
  })

  test('a stack of only structure blocks still draws', async ({ page }) => {
    const { s, page: p, errors } = await openStudio(page)
    await startDesign(page)
    await s.surface('Inbox · Apple Mail').click()
    await s.openTab('Insert')
    await insert(s, 'Divider')
    await insert(s, 'Space')

    // Not empty any more, so no start card — and no crash either.
    await expect(p.getByText('Nothing on the artboard yet')).toHaveCount(0)
    await expect(artboard(p).locator('hr')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('template mode never leaks a merged value onto any surface', async ({ page }) => {
    const { s, page: p } = await openStudio(page)
    await p.getByRole('button', { name: 'Tokens', exact: true }).click()
    for (const name of ['Inbox · Gmail', 'Notification · Lock screen', 'Inbox · Apple Mail',
      'Notification · Watch', 'Desktop · Gmail']) {
      await s.surface(name).click()
      await expect(artboard(p), `${name} leaked a merge`).not.toContainText('Rohit,')
      await expect(artboard(p)).toContainText('first_name')
    }
  })
})
