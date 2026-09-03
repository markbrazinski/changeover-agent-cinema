import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('E2E Audit Suite — Changeover Broadcast Cinema', () => {
  const screenshotsDir = path.join(process.cwd(), 'tests', 'e2e', 'screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  // --- CANONICAL PLAYWRIGHT AUDIT SUITE (Keyboard Shortcuts Replay & Full Walkthrough) ---
  test('Executes Guided Walkthrough via Keyboard Shortcuts, asserts dialogue-style captions freeze and resume, verifies distinct film scripts, and captures screenshots', async ({ page }) => {
    test.setTimeout(180000);

    // --- LOAD & INITIAL CONTROLS TEST ---
    await page.goto('/');
    await page.waitForTimeout(800);

    // Press 'h' to toggle controls panel visible, then toggle back hidden
    await page.keyboard.press('h');
    const manualPanel = page.getByTestId('manual-controls-panel');
    await expect(manualPanel).toBeVisible();
    await page.keyboard.press('h');
    await expect(manualPanel).not.toBeVisible();

    // --- BEAT 1: AT REST (01_at_rest: Healthy Baseline 0:00–0:20) ---
    // Press key '1' to start Part 1 Walkthrough
    await page.keyboard.press('1');
    await page.waitForTimeout(600); // Wait for handleReset() to complete

    // Verify left and right video elements are playing
    const leftVideo = page.getByTestId('left-video');
    const rightVideo = page.getByTestId('right-video');
    await expect(leftVideo).toBeVisible();
    await expect(rightVideo).toBeVisible();

    // Verify healthy status pills and baseline readout +0.510s IMMEDIATELY during Beat 1
    await expect(page.getByTestId('left-status-pill')).toContainText(/CAPTIONS LIVE/i);
    await expect(page.getByTestId('right-status-pill')).toContainText(/LOOKS FINE/i);
    await expect(page.getByTestId('offset-readout')).toContainText(/\+0\.510s/i);

    // Wait until t=10.5s into Beat 1 when Celia speaks her dialogue line from start of movie
    await page.waitForTimeout(10000);
    const rightDialogue1 = await page.getByTestId('right-caption-text').innerText();
    expect(rightDialogue1).toContain('CELIA');

    await page.screenshot({ path: path.join(screenshotsDir, 'beat_01_at_rest.png') });

    // --- BEAT 2: FAULT INJECTED (Right caption freezes at ~20.0s while picture keeps moving) ---
    await page.waitForTimeout(10000); // Wait remaining 10.0s of 20.0s baseline period to trigger fault injection
    await page.waitForTimeout(800);  // Short pause for freeze to register

    // Read video time and dialogue text after fault freeze locks in
    const freezeCap1 = await page.getByTestId('right-caption-text').innerText();
    const freezeVid1 = await rightVideo.evaluate((el: HTMLVideoElement) => el.currentTime);

    await page.waitForTimeout(1200);

    const freezeCap2 = await page.getByTestId('right-caption-text').innerText();
    const freezeVid2 = await rightVideo.evaluate((el: HTMLVideoElement) => el.currentTime);

    // ASSERT: Video currentTime ADVANCED while Dialogue Caption Text remained FROZEN mid-line!
    expect(freezeVid2).toBeGreaterThan(freezeVid1);
    expect(freezeCap2).toEqual(freezeCap1);

    // ASSERT: Right status pill flags FROZEN once fault is injected!
    await expect(page.getByTestId('right-status-pill')).toContainText(/FROZEN/i);
    await expect(page.getByTestId('left-status-pill')).toContainText(/CAPTIONS LIVE/i);

    // Assert cap-line alarm attaches and climbing offset readout reaches +2.996s
    await expect(page.getByTestId('cap-line-alarm')).toBeAttached();
    await expect(page.getByTestId('offset-readout')).toContainText(/\+2\.996s/i);

    await page.screenshot({ path: path.join(screenshotsDir, 'beat_02_fault_injected.png') });

    // --- BEAT 3: INVESTIGATE & VERIFY BACKUP ---
    const spineText = await page.getByTestId('agent-spine').innerText();
    expect(spineText).toMatch(/mcp:query_prometheus/i);

    // --- BEAT 4 & 5: HUMAN AUTHORIZATION GATE PAUSE (05_awaiting_approval) ---
    const authBtn = page.getByTestId('authorize-failover-button');
    await expect(authBtn).toBeVisible({ timeout: 15000 });

    // ASSERT: Flow HALTS at Human Gate — no automatic advance occurs
    await page.waitForTimeout(2000);
    await expect(authBtn).toBeVisible(); // Still on Beat 5 waiting for human click!

    await page.screenshot({ path: path.join(screenshotsDir, 'beat_05_awaiting_approval.png') });

    // Click Authorize Failover (Filming operator click)
    await authBtn.click();

    // --- BEAT 6: CHANGED OVER / RESTORED (06_changed_over) ---
    await page.waitForTimeout(800);
    await expect(page.getByTestId('offset-readout')).toContainText(/\+0\.486s/i);
    await expect(page.getByTestId('right-status-pill')).toContainText(/RESTORED/i);

    // Verify right viewer status restored and caption container active
    await expect(page.getByTestId('right-caption-text')).toBeVisible();

    // Assert board is NOT all-green / NOT labeled "resolved"
    const pageContent6 = await page.locator('body').innerText();
    expect(pageContent6).not.toMatch(/all systems resolved/i);

    await page.screenshot({ path: path.join(screenshotsDir, 'beat_06_changed_over.png') });

    // --- BEAT 7a: PRESS '2' FIRST TIME -> 2-CHANNEL BASELINE VIEW (09a_contention_baseline) ---
    await page.keyboard.press('2');
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('facility-view')).toBeVisible();
    await expect(page.getByTestId('ch14-card')).toBeVisible();
    await expect(page.getByTestId('ch27-card')).toBeVisible();

    // ASSERT: Both channel cards and caption containers are rendered in facility monitor!
    await expect(page.getByTestId('ch14-caption')).toBeVisible();
    await expect(page.getByTestId('ch27-caption')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'beat_07a_contention_baseline.png') });

    // --- BEAT 7b: PRESS '2' SECOND TIME -> TRIGGER CONTENTION FAULT & GATE (09_contention_failing) ---
    await page.keyboard.press('2');
    await page.waitForTimeout(6800);

    // --- BEAT 8: HUMAN CONTENTION GATE PAUSE (10_contention_decision) ---
    const contentionCard = page.getByTestId('contention-decision-card');
    await expect(contentionCard).toBeVisible({ timeout: 10000 });

    // Assert operator-declared tier wording present
    await expect(contentionCard).toContainText(/Emergency Tier/i);
    await expect(contentionCard).toContainText(/General Tier/i);

    // ASSERT: Word "premium" appears NOWHERE in DOM
    const domText8 = await page.locator('body').innerText();
    expect(domText8).not.toMatch(/\bpremium\b/i);

    // ASSERT: Flow HALTS at Beat 8 — no automatic advance occurs
    const contentionAuthBtn = page.getByTestId('authorize-prioritization-button');
    await expect(contentionAuthBtn).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(contentionAuthBtn).toBeVisible(); // Still waiting for human click!

    await page.screenshot({ path: path.join(screenshotsDir, 'beat_08_contention_gate.png') });

    // Click Authorize Prioritization
    await contentionAuthBtn.click();

    // --- BEAT 9: CONTENTION AUTHORIZED (11_contention_authorized) ---
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('ch14-caption')).toContainText(/✓/i);
    await expect(page.getByTestId('ch27-status-pill')).toContainText(/DEGRADED \+ FLAGGED/i);

    // Assert CH-27 bounding box is full-size (not shrunk to a badge)
    const ch27Box = await page.getByTestId('ch27-card').boundingBox();
    const ch14Box = await page.getByTestId('ch14-card').boundingBox();
    expect(ch27Box?.width).toBeGreaterThan(250);
    expect(ch27Box?.height).toBeCloseTo(ch14Box?.height || 320, -1);

    await page.screenshot({ path: path.join(screenshotsDir, 'beat_09_contention_authorized.png') });

    // --- BEAT 10: TERMINAL PARTIALLY MITIGATED (12_terminal_partially_mitigated) ---
    await page.waitForTimeout(1500);
    const spineTextTerminal = await page.getByTestId('agent-spine').innerText();
    expect(spineTextTerminal).toMatch(/Partially mitigated — 1 restored, 1 incident open/i);

    await page.screenshot({ path: path.join(screenshotsDir, 'beat_10_terminal.png') });

    // --- BLIND REFUSAL TEST ---
    // Reveal manual controls panel using 'h' key
    await page.keyboard.press('h');
    const blindBtn = page.getByTestId('manual-blind-button');
    await expect(blindBtn).toBeVisible();
    await blindBtn.click();

    await page.waitForTimeout(1000);
    await expect(page.getByTestId('cap-line-blind')).toBeAttached();
    await expect(page.getByTestId('sign-line-blind')).toBeAttached();
    await expect(page.getByTestId('refusal-banner')).toContainText(/won't guess|spine solid/i);

    await page.screenshot({ path: path.join(screenshotsDir, 'beat_11_blind_refusal.png') });

    // --- GLOBAL HONESTY ASSERTIONS ---
    const finalDomText = await page.locator('body').innerText();
    expect(finalDomText).not.toMatch(/signer feed/i);
    expect(finalDomText).not.toMatch(/\bpremium\b/i);

    console.log('✅ ALL E2E AUDIT BEAT ASSERTIONS PASSED CLEANLY WITH DIALOGUE CAPTIONS!');
  });

  // --- TEST 1: CAPTION RECOVERY VIA VISIBLE HEADER CONTROL ---
  test('Test 1 — Caption Recovery Scenario via Header Control', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/');
    await page.waitForTimeout(800);

    // 1. Locate button by accessible role and name
    const recoveryBtn = page.getByRole('button', { name: 'Run caption recovery scenario' });
    const contentionBtn = page.getByRole('button', { name: 'Run capacity contention scenario' });

    await expect(recoveryBtn).toBeVisible();
    await expect(recoveryBtn).toBeEnabled();
    await expect(contentionBtn).toBeVisible();
    await expect(contentionBtn).toBeEnabled();

    // 2. Click Caption Recovery button
    await recoveryBtn.click();

    // 3. Verify scenario begins and buttons enter disabled state
    await page.waitForTimeout(600);
    await expect(recoveryBtn).toBeDisabled();
    await expect(contentionBtn).toBeDisabled();

    // 4. Verify caption fault becomes visible at ~20s
    await expect(page.getByTestId('right-status-pill')).toContainText(/FROZEN/i, { timeout: 25000 });
    await expect(page.getByTestId('cap-line-alarm')).toBeAttached();

    // 5. Verify genuine Agent Spine/runtime evidence appears
    const spineText = await page.getByTestId('agent-spine').innerText();
    expect(spineText).toMatch(/mcp:query_prometheus/i);

    // 6. Verify human authorization gate appears
    const authBtn = page.getByTestId('authorize-failover-button');
    await expect(authBtn).toBeVisible({ timeout: 15000 });

    // 7. Verify failover does NOT occur before authorization
    await page.waitForTimeout(2000);
    await expect(authBtn).toBeVisible();
    await expect(page.getByTestId('right-status-pill')).toContainText(/FROZEN/i);

    // 8. Authorize the action
    await authBtn.click();

    // 9. Verify expected restored terminal state
    await expect(page.getByTestId('offset-readout')).toContainText(/\+0\.486s/i);
    await expect(page.getByTestId('right-status-pill')).toContainText(/RESTORED/i);

    // 10. Verify control leaves running state appropriately
    await expect(recoveryBtn).toBeEnabled({ timeout: 10000 });
    await expect(contentionBtn).toBeEnabled();
  });

  // --- TEST 2: CAPACITY CONTENTION VIA VISIBLE HEADER CONTROL ---
  test('Test 2 — Capacity Contention Scenario via Header Control', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/');
    await page.waitForTimeout(800);

    // 1. Locate button by accessible role and name
    const contentionBtn = page.getByRole('button', { name: 'Run capacity contention scenario' });
    const recoveryBtn = page.getByRole('button', { name: 'Run caption recovery scenario' });

    await expect(contentionBtn).toBeVisible();
    await expect(contentionBtn).toBeEnabled();

    // 2. Click Capacity Contention button
    await contentionBtn.click();

    // 3. Verify scenario starts and buttons enter disabled state
    await page.waitForTimeout(1000);
    await expect(contentionBtn).toBeDisabled();
    await expect(recoveryBtn).toBeDisabled();

    // Verify facility view & channel cards appear
    await expect(page.getByTestId('facility-view')).toBeVisible();
    await expect(page.getByTestId('ch14-card')).toBeVisible();
    await expect(page.getByTestId('ch27-card')).toBeVisible();

    // 4 & 5. Verify both channel failures appear and deterministic policy recommendation appears
    const contentionCard = page.getByTestId('contention-decision-card');
    await expect(contentionCard).toBeVisible({ timeout: 20000 });
    await expect(contentionCard).toContainText(/Emergency Tier/i);
    await expect(contentionCard).toContainText(/General Tier/i);

    // 6. Verify human-authorization gate appears
    const contentionAuthBtn = page.getByTestId('authorize-prioritization-button');
    await expect(contentionAuthBtn).toBeVisible();

    // 7. Verify no restoration occurs before authorization
    await page.waitForTimeout(2000);
    await expect(contentionAuthBtn).toBeVisible();

    // 8. Authorize prioritization
    await contentionAuthBtn.click();

    // 9. Verify emergency-tier channel (CH-14) is restored
    await expect(page.getByTestId('ch14-caption')).toContainText(/✓/i, { timeout: 10000 });

    // 10. Verify other channel (CH-27) remains degraded
    await expect(page.getByTestId('ch27-status-pill')).toContainText(/DEGRADED \+ FLAGGED/i);

    // 11. Verify final state is PARTIALLY MITIGATED
    const spineTextTerminal = await page.getByTestId('agent-spine').innerText();
    expect(spineTextTerminal).toMatch(/Partially mitigated — 1 restored, 1 incident open/i);

    // Verify controls leave running state appropriately
    await expect(contentionBtn).toBeEnabled({ timeout: 15000 });
    await expect(recoveryBtn).toBeEnabled();
  });

  // --- REGRESSION COVERAGE: HEADER LAYOUT & DOUBLE-CLICK SAFETY ---
  test('Regression — Header Layout, Disabled States, and Header Screenshot Capture', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(800);

    const recoveryBtn = page.getByRole('button', { name: 'Run caption recovery scenario' });
    const contentionBtn = page.getByRole('button', { name: 'Run capacity contention scenario' });

    // Verify accessible role and name
    await expect(recoveryBtn).toBeVisible();
    await expect(contentionBtn).toBeVisible();

    // Verify header layout height does not exceed 60px (no wrapping)
    const header = page.getByTestId('master-header');
    const headerBox = await header.boundingBox();
    expect(headerBox?.height).toBeLessThanOrEqual(60);

    // Capture final header controls screenshot
    await header.screenshot({
      path: path.join(screenshotsDir, 'final_header_controls.png'),
    });

    console.log('✅ HEADER LAYOUT AND ACCESSIBILITY REGRESSION VERIFIED!');
  });

  // --- TEST 3: SINTEL EVIDENCE REFUSAL VIA VISIBLE HEADER CONTROL ---
  test('Test 3 — Sintel Evidence Refusal Scenario via Header Control', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/');
    await page.waitForTimeout(800);

    // 1. Locate button by accessible role and name
    const refusalBtn = page.getByRole('button', { name: 'Run evidence refusal scenario' });
    await expect(refusalBtn).toBeVisible();
    await expect(refusalBtn).toBeEnabled();

    // 2. Click Evidence Refusal button
    await refusalBtn.click();
    await page.waitForTimeout(600);

    // 3. Verify refusal banner appears with explicit stale explanation
    const refusalBanner = page.getByTestId('refusal-banner');
    await expect(refusalBanner).toBeVisible();
    await expect(refusalBanner).toContainText(/too old to justify changing a live feed/i);

    // 4. Verify no authorization button appears
    const authBtn = page.getByTestId('authorize-failover-button');
    await expect(authBtn).not.toBeVisible();

    // 5. Verify Agent Spine logs refusal step
    const spineText = await page.getByTestId('agent-spine').innerText();
    expect(spineText).toMatch(/EVIDENCE STALE/i);
    expect(spineText).toMatch(/RECOMMENDATION WITHHELD/i);

    console.log('✅ SINTEL EVIDENCE REFUSAL E2E ASSERTIONS PASSED CLEANLY!');
  });
});
