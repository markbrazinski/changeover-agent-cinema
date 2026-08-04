import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('End-to-End Voiceover (VO) Script & Audit Suite', () => {
  test('Executes Narrated Autoplay Demo, verifies each stage beat & narration copy, captures screenshots', async ({ page }) => {
    // Ensure test-results directory exists
    const resultsDir = path.join(process.cwd(), 'test-results', 'vo_audit_screenshots');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // 1. Navigate to Changeover Master Control Room
    await page.goto('/');
    await expect(page).toHaveTitle(/Changeover|Vite/i);
    await page.waitForTimeout(1000);

    // Initial Screenshot: At Rest
    await page.screenshot({ path: path.join(resultsDir, '01_at_rest_initial.png') });

    // 2. Click "▶ RUN DEMO (NARRATED)"
    const runDemoBtn = page.getByRole('button', { name: /RUN DEMO/i });
    await expect(runDemoBtn).toBeVisible();
    await runDemoBtn.click();

    // --- BEAT 1: AT REST ---
    await expect(page.locator('main')).toContainText(/main program and viewer stream playing in sync/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_01_at_rest.png') });

    // --- BEAT 2: FAULT INJECTED ---
    await page.waitForTimeout(3000);
    await expect(page.locator('main')).toContainText(/CAPTIONS FROZEN/i);
    await expect(page.locator('main')).toContainText(/this viewer's captions visibly froze \+2.996s ago/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_02_fault_injected.png') });

    // --- BEAT 3: INVESTIGATE (MCP Query + Retry) ---
    await page.waitForTimeout(3800);
    await expect(page.locator('main')).toContainText(/querying Grafana/i);
    await expect(page.locator('main')).toContainText(/retries a query miss, and isolates the caption layer/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_03_investigate.png') });

    // --- BEAT 4: VERIFY BACKUP (ffprobe) ---
    await page.waitForTimeout(4000);
    await expect(page.locator('main')).toContainText(/backup ffprobe verified/i);
    await expect(page.locator('main')).toContainText(/verifies candidate backup health via ffprobe/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_04_verify_backup.png') });

    // --- BEAT 5: AWAITING APPROVAL & AUTHORIZE ---
    await page.waitForTimeout(3000);
    await expect(page.locator('main')).toContainText(/SUMMON/i);
    await expect(page.locator('main')).toContainText(/Human-in-the-loop gate/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_05_awaiting_approval.png') });

    // --- BEAT 6: CHANGED OVER (Restored +0.486s) ---
    await page.waitForTimeout(3500);
    await expect(page.locator('main')).toContainText(/confirmed restored/i);
    await expect(page.locator('main')).toContainText(/captions resume in sync on backup feed/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_06_changed_over.png') });

    // --- BEAT 7: CONTENTION SCENARIO (Two Movies) ---
    await page.waitForTimeout(3500);
    await expect(page.locator('main')).toContainText(/CONTENTION SCENARIO/i);
    await expect(page.locator('main')).toContainText(/protecting emergency tier over general tier/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_07_contention.png') });

    // --- BEAT 8: TERMINAL PARTIALLY MITIGATED ---
    await page.waitForTimeout(4500);
    await expect(page.locator('main')).toContainText(/Partially mitigated — 1 restored, 1 incident open/i);
    await expect(page.locator('main')).toContainText(/Resource scarcity cost remains visible/i);
    await page.screenshot({ path: path.join(resultsDir, 'beat_08_terminal.png') });

    console.log('✅ All 8 VO Script Narration Beats Verified & Screenshots Captured!');
  });
});
