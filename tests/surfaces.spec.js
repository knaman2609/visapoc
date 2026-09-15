import { expect, test } from '@playwright/test'
import { artboard, openStudio } from './helpers.js'

/**
 * Every surface in the catalogue, opened and looked at.
 *
 * The assertions are on what the client itself draws — Gmail's search field,
 * WhatsApp's business-account line, the Watch's Dismiss button — rather than
 * on the copy, so a mock that quietly stops being that client fails here.
 */
const SURFACES = {
  Email: [
    ['Notification · Lock screen', 'iPhone 15 Pro', 'once, for about a second', 'swipe|9:41'],
    ['Notification · Banner', 'iPhone 15 Pro', 'gone in four seconds', 'FaceTime'],
    ['Notification · Centre', 'iPhone 15 Pro', 'Stacked under everything else', 'Notification Centre'],
    ['Notification · Android', 'Pixel 8', 'Material 3', 'Mark as read'],
    ['Notification · Watch', 'Series 9, 45mm', '162px of readable width', 'Dismiss'],
    ['Inbox · Gmail', 'Gmail for iOS', 'the preheader is copy nobody wrote', 'Search in mail'],
    ['Inbox · Gmail, open', 'Gmail for iOS', 'inside Gmail', 'Reply all'],
    ['Inbox · Apple Mail', 'iPhone 15 Pro', 'no image blocking', 'To: Rohit'],
    ['Desktop · Gmail', '1440 × 900', 'Promotions tab, reading pane', 'Compose'],
  ],
  WhatsApp: [
    ['Notification · Lock screen', 'iPhone 15 Pro', 'once, for about a second', '9:41'],
    ['Notification · Banner', 'iPhone 15 Pro', 'gone in four seconds', 'WhatsApp'],
    ['Notification · Centre', 'iPhone 15 Pro', 'Stacked under everything else', 'Notification Centre'],
    ['Notification · Android', 'Pixel 8', 'Material 3', 'Archive'],
    ['Notification · Watch', 'Series 9, 45mm', '162px of readable width', 'Dismiss'],
    ['Thread · Chat', 'iPhone 15 Pro', 'header, body, footer and up to two buttons', 'Business account'],
    ['Thread · Chat list', 'iPhone 15 Pro', 'against every personal conversation', 'Aarti Menon'],
    ['Desktop · WhatsApp', '1440 × 900', '1,024 character ceiling', 'Type a message'],
  ],
  SMS: [
    ['Notification · Lock screen', 'iPhone 15 Pro', 'once, for about a second', '9:41'],
    ['Notification · Banner', 'iPhone 15 Pro', 'gone in four seconds', 'Swiggy'],
    ['Notification · Centre', 'iPhone 15 Pro', 'Stacked under everything else', 'Notification Centre'],
    ['Notification · Android', 'Pixel 8', 'Material 3', 'Archive'],
    ['Notification · Watch', 'Series 9, 45mm', '162px of readable width', 'Dismiss'],
    ['Thread · Thread', 'iPhone 15 Pro', 'segment boundary drawn where it bills', 'Text Message'],
    ['Thread · Thread list', 'iPhone 15 Pro', 'beside every OTP', 'JD-AIRTEL'],
  ],
}

for (const [channel, rows] of Object.entries(SURFACES)) {
  test(`${channel}: every surface renders`, async ({ page }) => {
    const { s, errors } = await openStudio(page)
    if (channel !== 'Email') await s.channel(channel).click()

    for (const [name, device, note, marker] of rows) {
      await s.surface(name).click()
      await expect(s.surface(name)).toHaveAttribute('aria-pressed', 'true')
      await expect(s.caption).toContainText(device)
      await expect(s.caption).toContainText(note)
      await expect(artboard(page)).toContainText(new RegExp(marker))
    }
    expect(errors).toEqual([])
  })
}

test('switching channel resets to that channel’s own surfaces', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  await expect(s.surface('Inbox · Gmail')).toHaveAttribute('aria-pressed', 'true')

  await s.channel('WhatsApp').click()
  await expect(s.surface('Thread · Chat')).toHaveAttribute('aria-pressed', 'true')
  await expect(p.getByRole('group', { name: 'Surface' })).not.toContainText('Apple Mail')

  await s.channel('SMS').click()
  await expect(s.surface('Thread · Thread')).toHaveAttribute('aria-pressed', 'true')

  await s.channel('Email').click()
  await expect(s.surface('Inbox · Gmail')).toHaveAttribute('aria-pressed', 'true')
})

test('dark mode is offered only where the client has one', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  const dark = p.getByRole('button', { name: 'Dark mode preview' })

  // The lock screen is already dark; there is nothing to swap.
  await s.surface('Notification · Lock screen').click()
  await expect(dark).toBeDisabled()

  await s.surface('Inbox · Gmail, open').click()
  await expect(dark).toBeEnabled()
  await dark.click()
  await expect(dark).toHaveAttribute('aria-pressed', 'true')

  // Gmail darkens the ground and lifts the text; the email really inverts.
  const paper = await artboard(page).locator('h2').first()
    .evaluate((el) => getComputedStyle(el).color)
  expect(paper).toBe('rgb(232, 234, 237)')
})

test('zoom steps and resets', async ({ page }) => {
  const { page: p } = await openStudio(page)
  const readout = p.getByTitle('Reset zoom')
  await expect(readout).toHaveText('90%')

  await p.getByRole('button', { name: 'Zoom in' }).click()
  await expect(readout).toHaveText('100%')
  await p.getByRole('button', { name: 'Zoom in' }).click()
  await expect(readout).toHaveText('115%')
  await expect(p.getByRole('button', { name: 'Zoom in' })).toBeDisabled()

  for (let i = 0; i < 6; i += 1) await p.getByRole('button', { name: 'Zoom out' }).click()
  await expect(readout).toHaveText('35%')
  await expect(p.getByRole('button', { name: 'Zoom out' })).toBeDisabled()

  // Fit can land between the stops, and stepping out of it still moves.
  await p.getByRole('button', { name: 'Fit to width' }).click()
  const fitted = Number((await readout.textContent()).replace('%', ''))
  await p.getByRole('button', { name: 'Zoom out' }).click()
  const stepped = Number((await readout.textContent()).replace('%', ''))
  expect(stepped).toBeLessThan(fitted)

  await readout.click()
  await expect(readout).toHaveText('90%')
})

test('a client cuts the copy where it actually cuts it', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  await s.surface('Inbox · Gmail').click()

  // Gmail for iOS stops at 33 characters. The rest is drawn struck through
  // rather than dropped, so the operator can see what was lost.
  const lost = artboard(page).locator('s, [class*="lost"]').first()
  await expect(lost).toContainText('your Visa Infinite')

  // The Watch is the same copy at 24 characters.
  await s.surface('Notification · Watch').click()
  await expect(artboard(page)).toContainText('Rohit, 5,000 bonus point…')

  // Template mode shows the tokens instead, never the merged words.
  await p.getByRole('button', { name: 'Tokens', exact: true }).click()
  await s.surface('Inbox · Gmail').click()
  await expect(artboard(page)).toContainText('first_name')
  await expect(artboard(page)).not.toContainText('Rohit,')
})

test('the longest cardholder is what truncates first', async ({ page }) => {
  const { s, page: p } = await openStudio(page)
  await s.surface('Notification · Watch').click()
  await expect(artboard(page)).toContainText('Rohit')

  await p.getByRole('button', { name: 'Longest', exact: true }).click()
  await expect(artboard(page)).toContainText('Priyadarshini')
  await expect(artboard(page)).toContainText('₹1,48,250')
})
