import { expect, test } from '@playwright/test';

test('native scrolling keeps sections and fixed navigation visible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).not.toBe('pending');
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const sections = await page.locator('main [data-rise], main [data-card], main [data-step], footer [data-line]').evaluateAll(nodes => nodes.map(node => ({ opacity: getComputedStyle(node).opacity, transform: getComputedStyle(node).transform })));
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      expect(section.opacity).toBe('1');
      expect(section.transform).toBe('none');
    }
    await expect(page.locator('nav[aria-label="Main"]')).not.toHaveAttribute('data-settled', 'pill');
    await expect(page.getByRole('link', { name: 'Beyond the Rumour Mill', exact: true }).first()).toBeInViewport();
    await page.screenshot({ path: test.info().outputPath(`native-scroll-${width}.png`) });
    const jump = page.getByRole('link', { name: 'Check a claim', exact: true }).last();
    await jump.click();
    await expect(page.locator('#hero-company')).toBeFocused();
    await expect(page.locator('#hero-company')).toBeInViewport();
  }
});
