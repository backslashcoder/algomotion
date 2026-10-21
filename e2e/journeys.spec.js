import { test, expect } from "@playwright/test";

const counter = (page) => page.getByTestId("step-counter");
const status = (page) => page.getByTestId("playback-status");
const stepNumber = async (page) =>
  Number((await counter(page).textContent()).match(/Step (\d+)/)[1]);
const totalSteps = async (page) =>
  Number((await counter(page).textContent()).match(/\/ (\d+)/)[1]);

async function openWorkspace(page, slug) {
  await page.goto(`/algorithms/${slug}`);
  await expect(counter(page)).toContainText("Step 1 /");
}

test.describe("discovery", () => {
  test("home → explorer → Bubble Sort", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("algorithms think");
    await page.getByRole("link", { name: /explore algorithms/i }).first().click();
    await expect(page).toHaveURL(/\/algorithms$/);
    await expect(page.getByTestId("result-count")).toHaveText("13 of 13 algorithms");
    await page.getByRole("main").getByRole("link", { name: /bubble sort/i }).click();
    await expect(page).toHaveURL(/\/algorithms\/bubble-sort$/);
    await expect(page.getByRole("heading", { level: 1, name: "Bubble Sort" })).toBeVisible();
    await expect(counter(page)).toContainText("Step 1 /");
  });

  test("explorer search, filters and empty state", async ({ page }) => {
    await page.goto("/algorithms");
    await page.getByRole("searchbox", { name: /search algorithms/i }).fill("queue");
    await expect(page.getByTestId("result-count")).toHaveText("1 of 13 algorithms");
    await page.getByRole("searchbox").fill("nothing-matches-this");
    await expect(page.getByRole("heading", { name: /no algorithms match/i })).toBeVisible();
    await page.getByRole("button", { name: /^clear filters$/i }).last().click();
    await page.getByRole("button", { name: "Searching" }).click();
    await expect(page.getByTestId("result-count")).toHaveText("2 of 13 algorithms");
    await page.getByRole("main").getByRole("link", { name: /binary search/i }).click();
    await expect(page).toHaveURL(/binary-search$/);
  });

  test("landing preview runs the real engine", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // no autoplay, so steps are deterministic
    await page.goto("/");
    const explanation = page.getByTestId("preview-explanation");
    await expect(explanation).toContainText("Starting with [5, 2, 8, 1, 9, 3]");
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(explanation).toContainText("Pass 1");
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(explanation).toContainText("Compare 5 and 2");
  });

  test("unknown algorithm shows the not-found page", async ({ page }) => {
    const response = await page.goto("/algorithms/not-a-real-algorithm");
    expect(response.status()).toBe(404);
  });
});

test.describe("Bubble Sort workspace", () => {
  test("play, pause, step forward and backward, reset, replay", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    const total = await totalSteps(page);
    await expect(status(page)).toHaveText("Ready");

    // fastest speed so the test stays quick
    await page.getByRole("radio", { name: "4×" }).click();
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(status(page)).toHaveText("Playing");
    await expect.poll(() => stepNumber(page)).toBeGreaterThan(2);

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(status(page)).toHaveText("Paused");
    const pausedAt = await stepNumber(page);
    await page.waitForTimeout(600);
    expect(await stepNumber(page)).toBe(pausedAt); // really paused

    await page.getByRole("button", { name: "Next step" }).click();
    expect(await stepNumber(page)).toBe(pausedAt + 1);
    await page.getByRole("button", { name: "Previous step" }).click();
    await page.getByRole("button", { name: "Previous step" }).click();
    expect(await stepNumber(page)).toBe(pausedAt - 1);

    await page.getByRole("button", { name: "Reset to first step" }).click();
    expect(await stepNumber(page)).toBe(1);
    await expect(status(page)).toHaveText("Ready");

    // run to the end, then replay
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(status(page)).toHaveText("Finished", { timeout: 30_000 });
    expect(await stepNumber(page)).toBe(total);
    await expect(page.getByTestId("explanation")).toContainText("Sorted: [1, 2, 3, 5, 6, 8, 9]");
    await page.getByRole("button", { name: "Replay" }).click();
    await expect(status(page)).toHaveText("Playing");
    await expect.poll(() => stepNumber(page)).toBeLessThan(total);
  });

  test("scrubber seeks and pseudocode + explanation follow the step", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    const slider = page.getByRole("slider", { name: "Step timeline" });
    await slider.focus();
    await page.keyboard.press("End");
    await expect(counter(page)).toContainText(`Step ${await totalSteps(page)} /`);
    await expect(page.locator("[data-line='done']")).toHaveAttribute("aria-current", "step");
    await page.keyboard.press("Home");
    await expect(counter(page)).toContainText("Step 1 /");

    // step to the first swap and check the highlighted line and explanation agree
    for (let i = 0; i < 3; i += 1) await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByTestId("explanation")).toContainText("Swap 6 and 3");
    await expect(page.locator("[data-line='swap']")).toHaveAttribute("aria-current", "step");
    await expect(page.locator("[data-metric='swaps']")).toHaveText("1");
    await page.getByRole("button", { name: "Previous step" }).click();
    await expect(page.locator("[data-line='compare']")).toHaveAttribute("aria-current", "step");
    await expect(page.locator("[data-metric='swaps']")).toHaveText("0");
  });

  test("keyboard shortcuts work and are ignored while typing", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    await page.locator("body").click({ position: { x: 5, y: 300 } });
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect(await stepNumber(page)).toBe(3);
    await page.keyboard.press("ArrowLeft");
    expect(await stepNumber(page)).toBe(2);
    await page.keyboard.press("End");
    await expect(status(page)).toHaveText("Finished");
    await page.keyboard.press("Home");
    await expect(status(page)).toHaveText("Ready");
    await page.keyboard.press("Space");
    await expect(status(page)).toHaveText("Playing");
    await expect.poll(() => stepNumber(page)).toBeGreaterThan(1);
    await page.keyboard.press("Space");
    await expect(status(page)).toHaveText("Paused");

    // typing in the input must not drive playback
    const before = await stepNumber(page);
    const field = page.getByLabel("Array values");
    await field.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.type(" ");
    expect(await stepNumber(page)).toBe(before);
    await expect(status(page)).toHaveText("Paused");
  });

  test("changing the input regenerates the trace; invalid input is rejected inline", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    const originalTotal = await totalSteps(page);
    await page.getByRole("button", { name: "Next step" }).click();
    await page.getByRole("button", { name: "Next step" }).click();

    const field = page.getByLabel("Array values");
    await field.fill("3, 1, 2");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByTestId("stage").getByRole("img")).toHaveAccessibleName(/3, 1, 2/);
    expect(await stepNumber(page)).toBe(1); // reset
    expect(await totalSteps(page)).not.toBe(originalTotal);

    await field.fill("4, banana, 1");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toContainText("banana");
    // previous valid trace is still intact
    await expect(page.getByTestId("stage").getByRole("img")).toHaveAccessibleName(/3, 1, 2/);

    await field.fill("");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toContainText(/at least 1/);

    await page.getByRole("button", { name: "Reversed" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toHaveCount(0);
    await page.getByRole("button", { name: "Default" }).click();
    await expect(page.getByTestId("stage").getByRole("img")).toHaveAccessibleName(/6, 3, 8, 2, 9, 1, 5/);
  });

  test("changing input while playing stops playback", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    await page.getByRole("radio", { name: "4×" }).click();
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect.poll(() => stepNumber(page)).toBeGreaterThan(1);
    await page.getByLabel("Array values").fill("2, 1");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(status(page)).toHaveText("Ready");
    await page.waitForTimeout(500);
    expect(await stepNumber(page)).toBe(1);
  });

  test("speed preference persists across reloads", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    await page.getByRole("radio", { name: "2×" }).click();
    await page.reload();
    await expect(counter(page)).toContainText("Step 1 /");
    await expect(page.getByRole("radio", { name: "2×" })).toHaveAttribute("aria-checked", "true");
  });
});

test.describe("other algorithms", () => {
  test("Merge Sort shows the merge buffer and finishes sorted", async ({ page }) => {
    await openWorkspace(page, "merge-sort");
    await page.getByRole("slider", { name: "Step timeline" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByTestId("explanation")).toContainText("Sorted: [1, 2, 3, 4, 6, 7, 8, 9]");
    await expect(page.locator("[data-metric='merges']")).toHaveText("7");
  });

  test("Insertion Sort steps through shifting", async ({ page }) => {
    await openWorkspace(page, "insertion-sort");
    await page.getByRole("slider", { name: "Step timeline" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByTestId("explanation")).toContainText("Sorted: [1, 2, 3, 5, 6, 8, 9]");
  });

  test("Binary Search finds the target, handles missing targets and unsorted input", async ({ page }) => {
    await openWorkspace(page, "binary-search");
    await page.getByRole("slider", { name: "Step timeline" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByTestId("explanation")).toContainText("41 is at index 6");

    await page.getByLabel("Target").fill("42");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByRole("slider", { name: "Step timeline" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByTestId("explanation")).toContainText("42 is not present");

    await page.getByLabel("Sorted array").fill("9, 3, 5");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toContainText(/ascending order/);
    await page.getByRole("button", { name: "Sort array" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toHaveCount(0);
    await expect(page.getByTestId("stage").getByRole("img")).toHaveAccessibleName(/3, 5, 9/);
  });

  test("BFS renders the graph, queue and traversal order, and handles disconnected graphs", async ({ page }) => {
    await openWorkspace(page, "breadth-first-search");
    const stage = page.getByTestId("stage");
    await expect(stage.getByRole("img")).toHaveAccessibleName(/Graph with 7 nodes and 6 edges/);
    await expect(stage.getByText("nothing visited yet")).toBeVisible();

    for (let i = 0; i < 9; i += 1) await page.getByRole("button", { name: "Next step" }).click();
    await expect(stage.getByRole("list", { name: "Queue" })).not.toContainText("empty");
    await expect(stage.getByRole("list", { name: "Traversal order" })).toContainText("A");
    await expect(page.getByTestId("explanation")).not.toBeEmpty();

    await page.getByRole("slider", { name: "Step timeline" }).focus();
    await page.keyboard.press("End");
    await expect(stage.getByRole("list", { name: "Traversal order" })).toHaveText(/A.*B.*C.*D.*E.*F.*G/);
    await expect(page.locator("[data-metric='visited']")).toHaveText("7");

    await page.getByRole("button", { name: "Disconnected" }).click();
    await page.getByRole("slider", { name: "Step timeline" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByTestId("explanation")).toContainText("D, E, F cannot be reached");

    await page.getByLabel("Edges", { exact: true }).fill("A-Q");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toContainText(/not in the node list/);

    await page.getByRole("button", { name: "Default" }).click();
    await expect(stage.getByRole("img")).toHaveAccessibleName(/Graph with 7 nodes/);
  });

  test("switching algorithms mid-playback leaves a clean workspace", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    await page.getByRole("radio", { name: "4×" }).click();
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect.poll(() => stepNumber(page)).toBeGreaterThan(1);
    await page.getByRole("link", { name: "Algorithms", exact: true }).first().click();
    await page.getByRole("main").getByRole("link", { name: /breadth-first search/i }).click();
    await expect(counter(page)).toContainText("Step 1 /");
    await expect(status(page)).toHaveText("Ready");
    await page.waitForTimeout(500);
    expect(await stepNumber(page)).toBe(1);
  });
});

test.describe("responsive", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mobile workspace keeps controls usable without horizontal scroll", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Next step" }).click();
    expect(await stepNumber(page)).toBe(2);
    // keyboard shortcuts are hidden on small screens; the step counter takes their place
    await expect(page.getByText("Keyboard shortcuts")).toBeHidden();
    await expect(counter(page)).toBeVisible();
    await expect(status(page)).toBeVisible();
    const speed = await page.getByRole("radiogroup", { name: "Playback speed" }).boundingBox();
    const count = await counter(page).boundingBox();
    expect(count.y).toBeGreaterThan(speed.y + speed.height - 1); // counter sits below the speed control
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("accessibility basics", () => {
  test("reduced motion removes transition durations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspace(page, "bubble-sort");
    const duration = await page
      .getByTestId("stage")
      .locator("g.viz-move")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(duration)).toBeLessThan(0.05);
  });

  test("explanation is announced via a polite live region only when not playing", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    const live = page.getByRole("status").filter({ hasText: /Bubble sort will sweep/ });
    await expect(live).toHaveAttribute("aria-live", "polite");
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Pass 1/ })).toHaveCount(1);
  });
});

test.describe("motion", () => {
  test("landing preview plays by itself and can be paused", async ({ page }) => {
    await page.goto("/");
    const explanation = page.getByTestId("preview-explanation");
    await expect(explanation).toContainText("Starting with");
    await expect(explanation).not.toContainText("Starting with", { timeout: 8000 }); // autoplay advanced
    await page.getByRole("button", { name: "Pause" }).click();
    const frozen = await explanation.textContent();
    await page.waitForTimeout(1200);
    expect(await explanation.textContent()).toBe(frozen);
  });

  test("swapping bars hop along an arc and pointers are separate elements", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    for (let i = 0; i < 3; i += 1) await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByTestId("explanation")).toContainText("Swap 6 and 3");
    await expect(page.getByTestId("stage").locator(".viz-hop-up")).toHaveCount(1);
    await expect(page.getByTestId("stage").locator(".viz-hop-down")).toHaveCount(1);
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByTestId("stage").locator(".viz-hop-up")).toHaveCount(0);
  });

  test("completion plays a wave over the sorted elements; reduced motion removes durations", async ({ page }) => {
    await openWorkspace(page, "bubble-sort");
    await page.getByRole("slider", { name: "Step timeline" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByTestId("stage").locator(".viz-wave")).toHaveCount(7);
  });

  test("graph: current node has a pulsing ring and tree edges draw themselves", async ({ page }) => {
    await openWorkspace(page, "breadth-first-search");
    for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByTestId("stage").locator(".viz-ring")).toHaveCount(1);
    await page.getByRole("slider", { name: "Step timeline" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByTestId("stage").locator("line.viz-draw")).toHaveCount(6);
  });
});
