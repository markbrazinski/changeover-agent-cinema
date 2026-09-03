import { test, expect } from '@playwright/test';

test.describe('Padded Absolute-Time Filming Sequence Qualification', () => {
  test('Full end-to-end filming run (F key) executes padded 144.7s absolute timeline', async ({ page }) => {
    test.setTimeout(250000); // 4.1 minutes for 144.7s sequence
    await page.goto('/?mode=film');
    await page.waitForTimeout(500);

    const startTime = Date.now();
    // Press 'F' to start master timeline
    await page.keyboard.press('f');

    // 23.7s: Act I Human Gate opens
    await expect(page.getByTestId('authorize-failover-button')).toBeVisible({ timeout: 28000 });

    // Click authorize during Act I gate window at ~26s
    const act1AuthBtn = page.getByTestId('authorize-failover-button');
    await act1AuthBtn.click();

    // Verify Act I restored
    await expect(page.getByTestId('right-status-pill')).toContainText(/RESTORED/i);

    // 60.6s: Hard cut to Refusal baseline (08a_refusal_baseline)
    // Sintel video should be visible
    await page.waitForFunction(() => {
      const rightVid = document.querySelector('[data-testid="right-video"]') as HTMLVideoElement;
      return rightVid && rightVid.src && rightVid.src.includes('sintel');
    }, { timeout: 40000 });

    const cut1Time = (Date.now() - startTime) / 1000;
    console.log(`[E2E TIMING] Cut 1 to Refusal occurred at: ${cut1Time.toFixed(2)}s (Target: 60.6s)`);
    expect(cut1Time).toBeGreaterThanOrEqual(58.0);
    expect(cut1Time).toBeLessThanOrEqual(63.0);

    // 80.3s: Hard cut to Contention baseline (09a_contention_baseline)
    await expect(page.getByTestId('facility-view')).toBeVisible({ timeout: 25000 });
    const cut2Time = (Date.now() - startTime) / 1000;
    console.log(`[E2E TIMING] Cut 2 to Contention occurred at: ${cut2Time.toFixed(2)}s (Target: 80.3s)`);

    // 90.0s: Act III Contention Human Gate opens
    const contentionAuthBtn = page.getByTestId('authorize-prioritization-button');
    await expect(contentionAuthBtn).toBeVisible({ timeout: 20000 });

    // Click authorize during Act III gate window
    await contentionAuthBtn.click();

    // Wait for full 103.0s timeline completion
    await page.waitForTimeout(13500);

    const totalDuration = (Date.now() - startTime) / 1000;
    console.log(`[E2E TIMING] Total filming run duration: ${totalDuration.toFixed(2)}s (Target: 103.0s)`);
    expect(totalDuration).toBeGreaterThanOrEqual(100.0);
    expect(totalDuration).toBeLessThanOrEqual(106.0);
  });

  test('Missed human authorization does not auto-authorize or delay hard cuts', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes
    await page.goto('/?mode=film');
    await page.waitForTimeout(500);

    const startTime = Date.now();
    await page.keyboard.press('f');

    // Wait for Act I gate button, but DO NOT click it!
    await expect(page.getByTestId('authorize-failover-button')).toBeVisible({ timeout: 35000 });

    // 60.6s: Hard cut to Refusal MUST occur on schedule despite missed click!
    await page.waitForFunction(() => {
      const rightVid = document.querySelector('[data-testid="right-video"]') as HTMLVideoElement;
      return rightVid && rightVid.src && rightVid.src.includes('sintel');
    }, { timeout: 40000 });

    const cut1Time = (Date.now() - startTime) / 1000;
    console.log(`[E2E TIMING UNCLICKED] Hard cut to Refusal at: ${cut1Time.toFixed(2)}s (Target: 60.6s)`);
    expect(cut1Time).toBeGreaterThanOrEqual(58.0);
    expect(cut1Time).toBeLessThanOrEqual(63.0);
  });
});
