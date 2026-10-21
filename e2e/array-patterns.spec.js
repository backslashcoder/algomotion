import { test, expect } from "@playwright/test";

const counter = (page) => page.getByTestId("step-counter");

async function openWorkspace(page, slug) {
  await page.goto(`/algorithms/${slug}`);
  await expect(counter(page)).toContainText("Step 1 /");
}

async function toEnd(page) {
  await page.getByRole("slider", { name: "Step timeline" }).focus();
  await page.keyboard.press("End");
}

test.describe("array patterns", () => {
  test("technique filter in the explorer", async ({ page }) => {
    await page.goto("/algorithms");
    await page.getByRole("button", { name: "Sliding window" }).click();
    await expect(page.getByTestId("result-count")).toHaveText("2 of 13 algorithms");
    await page.getByRole("main").getByRole("link", { name: /min size|smallest subarray/i }).first().click();
    await expect(page).toHaveURL(/min-size-subarray-sum$/);
  });

  test("Two Sum finds the pair, reports no pair, and asks for sorted input", async ({ page }) => {
    await openWorkspace(page, "two-sum-sorted");
    await toEnd(page);
    await expect(page.getByTestId("explanation")).toContainText("(3, 11) at indices (1, 5)");

    await page.getByLabel("Target sum").fill("1000");
    await page.getByRole("button", { name: "Apply" }).click();
    await toEnd(page);
    await expect(page.getByTestId("explanation")).toContainText("no pair sums to 1000");

    await page.getByLabel("Sorted array").fill("9, 1, 5");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toContainText(/ascending order/);
    await page.getByRole("button", { name: "Sort array" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toHaveCount(0);
  });

  test("Sliding window shows the live window sum and the best window", async ({ page }) => {
    await openWorkspace(page, "sliding-window-max-sum");
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByTestId("stage")).toContainText("sum = 8"); // 2 + 1 + 5
    await page.getByRole("button", { name: "Next step" }).click();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByTestId("stage")).toContainText("sum = 7"); // 1 + 5 + 1
    await toEnd(page);
    await expect(page.getByTestId("explanation")).toContainText("indices 4–6");
    await expect(page.getByTestId("explanation")).toContainText("sum 13");

    await page.getByLabel("Window size k").fill("20");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toContainText(
      /between 1 and the array length/,
    );
  });

  test("the remaining array patterns reach the right answer", async ({ page }) => {
    const cases = [
      ["min-size-subarray-sum", "shortest window is indices"],
      ["kadane", "maximum subarray sum is 6"],
      ["remove-duplicates", "5 unique values"],
      ["dutch-national-flag", "Sorted: [0, 0, 0, 1, 1, 1, 2, 2, 2]"],
      ["lower-bound", "leftmost occurrence"],
      ["quick-sort", "Sorted: [1, 2, 3, 4, 6, 7, 8, 9]"],
    ];
    for (const [slug, text] of cases) {
      await openWorkspace(page, slug);
      await toEnd(page);
      await expect(page.getByTestId("explanation")).toContainText(text);
    }
  });

  test("Dutch Flag rejects values other than 0, 1, 2", async ({ page }) => {
    await openWorkspace(page, "dutch-national-flag");
    await page.getByLabel("Array values").fill("0, 3, 1");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toContainText("0, 1 or 2");
  });

  test("example buttons produce runnable traces", async ({ page }) => {
    await openWorkspace(page, "kadane");
    await page.getByRole("button", { name: "All negative" }).click();
    await expect(page.getByTestId("input-panel").getByRole("alert")).toHaveCount(0);
    await toEnd(page);
    await expect(page.getByTestId("explanation")).toContainText("maximum subarray sum is -");
  });
});
