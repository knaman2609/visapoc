import { expect, test } from '@playwright/test'


/**
 * The studio shares its handset and laptop frames with the rest of the
 * console. Changing them is exactly the kind of edit that breaks a screen
 * nobody was looking at, so every route is opened and every page that draws a
 * device is checked.
 */
const watch = (page) => {
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}

test('the suite is pointed at the app running on :5173', async ({ page }) => {
  const res = await page.goto('/pm/studio')
  expect(res.status()).toBe(200)
  expect(new URL(page.url()).origin).toBe('http://localhost:5173')
  // And what is served there is this build of the studio, not a stale one:
  // the seven-panel rail and the surface catalogue are both post-rewrite.
  // Six panels plus the collapse control — the library moved to its own screen.
  await expect(page.getByRole('navigation', { name: 'Studio panels' })
    .getByRole('button')).toHaveCount(7)
  await expect(page.getByRole('group', { name: 'Surface' })
    .getByRole('button')).toHaveCount(9)
})

const ROUTES = [
  ['/pm/assistant', 'Assistant'],
  ['/pm/scans', 'Scans'],
  ['/pm/campaigns', 'Campaigns'],
  ['/pm/deep-dive', 'Deep dive'],
  ['/pm/studio', 'Campaign studio'],
  ['/pm/analytics', 'Analytics'],
  ['/pm/users', 'Users'],
  ['/pm/roles', 'Roles'],
  ['/customers', 'Customer queue'],
  ['/pm/workflows', 'Workflows'],
  ['/rm', 'Dashboard'],
  ['/rm/analytics', 'Analytics'],
]

for (const [path, label] of ROUTES) {
  test(`route ${path} renders without erroring`, async ({ page }) => {
    const errors = watch(page)
    await page.goto(path)
    await expect(page.getByRole('navigation', { name: 'Console sections' })).toBeVisible()
    // A screen that threw leaves the shell with nothing under it.
    const text = await page.locator('body').innerText()
    expect(text.length, `${label} is blank`).toBeGreaterThan(300)
    expect(errors, `${label} logged errors`).toEqual([])
  })
}

test('every step of the flow renders', async ({ page }) => {
  const errors = watch(page)
  for (let step = 0; step <= 7; step += 1) {
    await page.goto(`/pm/flow/${step}`)
    await expect(page.getByRole('navigation', { name: 'Console sections' })).toBeVisible()
    // A step that threw would leave the shell with nothing under it.
    const text = await page.locator('body').innerText()
    expect(text.length, `step ${step} is blank`).toBeGreaterThan(200)
  }
  expect(errors).toEqual([])
})

test('the preview step still draws its handsets', async ({ page }) => {
  const errors = watch(page)
  await page.goto('/pm/flow/4')
  // The step opens on email, which is a card rather than a phone; the
  // messaging channels are the ones that use the shared handset frame.
  await page.getByRole('button', { name: 'WhatsApp' }).first().click({ timeout: 20_000 })
  const shell = page.locator('[class*="bezel"]').first()
  await expect(shell).toBeVisible()
  // The iOS chrome the studio also uses: an island and a home indicator.
  await expect(page.locator('[class*="island"]').first()).toBeVisible()
  await expect(page.locator('[class*="homeBar"]').first()).toBeVisible()

  await page.getByRole('button', { name: 'SMS' }).first().click()
  await expect(page.locator('[class*="bezel"]').first()).toBeVisible()
  expect(errors).toEqual([])
})

test('a relationship-manager customer still draws its phone', async ({ page }) => {
  const errors = watch(page)
  await page.goto('/rm/customer/activation')
  await expect(page.locator('[class*="bezel"]').first()).toBeVisible()
  await expect(page.locator('[class*="screen"]').first()).toBeVisible()
  expect(errors).toEqual([])
})

test('the profile drawer opens and draws its phone', async ({ page }) => {
  const errors = watch(page)
  await page.goto('/pm/assistant')
  await page.locator('button[aria-label*="Switch view"]').click()
  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.getByRole('menuitem').first()).toBeVisible()
  expect(errors).toEqual([])
})

test('a user detail page opens from the list', async ({ page }) => {
  const errors = watch(page)
  await page.goto('/pm/users')
  await page.getByRole('link').filter({ hasText: /@/ }).first().click()
  await expect(page).toHaveURL(/\/pm\/users\/./)
  expect(errors).toEqual([])
})

test('unknown paths land on the front door', async ({ page }) => {
  await page.goto('/nowhere-at-all')
  await expect(page).toHaveURL(/\/pm\/assistant/)
  await page.goto('/admin/anything')
  await expect(page).toHaveURL(/\/pm\/users/)
})

test('the old relationship-manager URLs still resolve', async ({ page }) => {
  // The customer queue moved to a neutral URL; the old paths only redirect.
  await page.goto('/rm')
  await expect(page).toHaveURL(/\/customers/)
  await page.goto('/rm/customer/activation')
  await expect(page).toHaveURL(/\/customers\/activation/)
  await expect(page.locator('[class*="bezel"]').first()).toBeVisible()
})

test('the sidebar reaches the studio', async ({ page }) => {
  await page.goto('/pm/assistant')
  await page.getByRole('button', { name: 'Campaign studio' }).click()
  await expect(page).toHaveURL(/\/pm\/studio/)
  await expect(page.getByLabel('Design name')).toBeVisible()
})
