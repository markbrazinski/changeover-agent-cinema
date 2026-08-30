import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('End-to-End Voiceover (VO) Script & Audit Suite', () => {
  test('Executes Autoplay Demo, verifies each stage beat & UI state, captures screenshots', async ({ page }) => {
    test.setTimeout(90000);
    const resultsDir = path.join(process.cwd(), 'tests/e2e/screenshots');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // 1. Navigate to main application page
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/Changeover/i);
    await page.waitForTimeout(1000);

    // Initial Screenshot: At Rest
    await page.screenshot({ path: path.join(resultsDir, '01_at_rest_initial.png') });

    // --- BEAT 1: AT REST ---
    await expect(page.locator('main')).toContainText(/CAPTIONS LIVE|IN SYNC/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_01_at_rest.png') });

    // 2. Click "CAPTION RECOVERY" scenario button
    const runDemoBtn = page.getByTestId('scenario-caption-recovery-button');
    await expect(runDemoBtn).toBeVisible();
    await runDemoBtn.click();

    // --- BEAT 2: FAULT INJECTED & STAGGERED RECOVERY ---
    await page.waitForTimeout(3000);
    await expect(page.locator('main')).toContainText(/CAPTIONS FROZEN|\+2\.996s/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_02_fault_injected.png') });

    // --- BEAT 3: OPERATOR AUTHORIZATION GATE ---
    await page.waitForTimeout(35000);
    const authBtn = page.getByTestId('authorize-failover-button');
    if (await authBtn.isVisible()) {
      await page.screenshot({ path: path.join(resultsDir, 'beat_05_awaiting_approval.png') });
      await authBtn.click();
    }

    // --- BEAT 4: CHANGED OVER (RESTORED) ---
    await page.waitForTimeout(3000);
    await expect(page.locator('main')).toContainText(/RESTORED|\+0\.486s/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_06_changed_over.png') });
  });
});
