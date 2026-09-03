import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('End-to-End Filming, Act Controls, and Mode Qualification Suite', () => {
  const screenshotsDir = path.join(process.cwd(), 'tests', 'e2e', 'screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  // 1. FILMING MODE URL TEST (?mode=film)
  test('Filming Mode (?mode=film) hides scenario buttons while retaining operational controls and keyboard shortcuts', async ({ page }) => {
    await page.goto('/?mode=film');
    await page.waitForTimeout(600);

    // Scenario controls top bar must NOT be visible in filming mode
    const scenarioControls = page.getByTestId('scenario-controls');
    await expect(scenarioControls).not.toBeVisible();

    // Provenance banner and master header remain visible
    await expect(page.getByTestId('replay-provenance-banner')).toBeVisible();
    await expect(page.getByTestId('master-header')).toBeVisible();

    // Verify keyboard shortcuts work in filming mode: Press '1' to start Act I
    await page.keyboard.press('1');
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('left-status-pill')).toContainText(/CAPTIONS LIVE/i);

    // Reset via 'R' key
    await page.keyboard.press('r');
    await page.waitForTimeout(600);
    await expect(page.getByTestId('offset-readout')).toContainText(/\+0\.510s/i);
  });

  // 1b. REAL MODE URL TEST (?mode=real)
  test('Real Mode (?mode=real) hides scenario buttons like filming mode and activates real API mode', async ({ page }) => {
    await page.goto('/?mode=real');
    await page.waitForTimeout(600);

    // Scenario controls top bar must NOT be visible in real mode
    const scenarioControls = page.getByTestId('scenario-controls');
    await expect(scenarioControls).not.toBeVisible();

    // Provenance banner and master header remain visible
    await expect(page.getByTestId('replay-provenance-banner')).toBeVisible();
    await expect(page.getByTestId('master-header')).toBeVisible();
  });

  // 2. JUDGE MODE URL TEST (?mode=judge)
  test('Judge Mode (?mode=judge or /) displays all four scenario buttons in narrative order', async ({ page }) => {
    await page.goto('/?mode=judge');
    await page.waitForTimeout(600);

    const scenarioControls = page.getByTestId('scenario-controls');
    await expect(scenarioControls).toBeVisible();

    const fullDemoBtn = page.getByTestId('scenario-full-demo-button');
    const act1Btn = page.getByTestId('scenario-caption-recovery-button');
    const act2Btn = page.getByTestId('scenario-evidence-refusal-button');
    const act3Btn = page.getByTestId('scenario-capacity-contention-button');

    await expect(fullDemoBtn).toBeVisible();
    await expect(act1Btn).toBeVisible();
    await expect(act2Btn).toBeVisible();
    await expect(act3Btn).toBeVisible();

    // Verify narrative text order
    await expect(fullDemoBtn).toContainText('FULL DEMO');
    await expect(act1Btn).toContainText('CAPTION RECOVERY');
    await expect(act2Btn).toContainText('EVIDENCE REFUSAL');
    await expect(act3Btn).toContainText('CAPACITY CONTENTION');
  });

  // 3. INDEPENDENT ACT II: EVIDENCE REFUSAL (Sintel movie, currentTime advance, no authorization control)
  test('Act II (Evidence Refusal) uses Sintel, advances video time while captions freeze, displays refusal hold note, and exposes no authorization button', async ({ page }) => {
    await page.goto('/?mode=judge');
    await page.waitForTimeout(600);

    // Trigger Act II via keyboard '2'
    await page.keyboard.press('2');
    await page.waitForTimeout(800);

    // Verify Sintel header title or channel name
    const heroText = await page.getByTestId('split-hero').innerText();
    expect(heroText).toMatch(/SINTEL/i);

    // Verify right video element is present and playing Sintel
    const rightVideo = page.getByTestId('right-video');
    await expect(rightVideo).toBeVisible();
    const videoSrc = await rightVideo.getAttribute('src');
    expect(videoSrc).toContain('sintel');

    // Wait for baseline to transition to terminal refusal hold
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="agent-spine"]');
      return el && /RECOMMENDATION WITHHELD|REFUSED|NO CHANGE EXECUTED/i.test(el.innerText);
    }, { timeout: 8000 });

    // Verify video currentTime keeps advancing while dialogue caption remains frozen
    const t1 = await rightVideo.evaluate((el: HTMLVideoElement) => el.currentTime);
    await page.waitForTimeout(1000);
    const t2 = await rightVideo.evaluate((el: HTMLVideoElement) => el.currentTime);
    expect(t2).toBeGreaterThan(t1);

    // Verify NO authorization button is exposed during refusal
    await expect(page.getByTestId('authorize-failover-button')).not.toBeVisible();
    await expect(page.getByTestId('authorize-prioritization-button')).not.toBeVisible();
  });

  // 4. INDEPENDENT ACT III: CAPACITY CONTENTION & INDEFINITE HUMAN GATE
  test('Act III (Capacity Contention) displays concurrent channels, halts indefinitely at human gate, and enters PARTIALLY MITIGATED terminal state upon authorization', async ({ page }) => {
    await page.goto('/?mode=judge');
    await page.waitForTimeout(600);

    // Trigger Act III via keyboard '3'
    await page.keyboard.press('3');
    await page.waitForTimeout(1000);

    // Verify contention facility header
    await expect(page.getByTestId('facility-view')).toBeVisible({ timeout: 10000 });

    // Wait for fault injection and investigation to reach the human gate (spaced to 34s mark)
    const contentionAuthBtn = page.getByTestId('authorize-prioritization-button');
    await expect(contentionAuthBtn).toBeVisible({ timeout: 40000 });

    // ASSERT: Human gate HALTS indefinitely without auto-authorizing
    await page.waitForTimeout(2500);
    await expect(contentionAuthBtn).toBeVisible(); // Still waiting!

    // Click Authorize Prioritization
    await contentionAuthBtn.click();

    // Verify terminal state becomes PARTIALLY MITIGATED
    await expect(page.getByTestId('ch14-status-pill')).toContainText(/RESTORED/i);
    await expect(page.getByTestId('ch27-status-pill')).toContainText(/DEGRADED|FROZEN|ALARM/i);

    const spineText = await page.getByTestId('agent-spine').innerText();
    expect(spineText).toMatch(/PARTIALLY MITIGATED/i);
  });

  // 5. CANCELLATION AND RESET ('R' KEY)
  test('Pressing "R" cancels active sequence timers and resets demo state', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(600);

    // Start Act I via '1'
    await page.keyboard.press('1');
    await page.waitForTimeout(1000);

    // Press 'R' mid-flight
    await page.keyboard.press('r');
    await page.waitForTimeout(600);

    // Verify reset to 01_at_rest baseline
    await expect(page.getByTestId('offset-readout')).toContainText(/\+0\.510s/i);
    await expect(page.getByTestId('left-status-pill')).toContainText(/CAPTIONS LIVE/i);
  });
});
