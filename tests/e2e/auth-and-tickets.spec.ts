import { test, expect, Page } from "@playwright/test";

async function loginAs(page: Page, persona: string = "Alex Vance") {
  await page.goto("/login");
  await page.click(`text=${persona}`);
  await page.click("button:has-text('Sign In to Workstation')");
  await expect(page).toHaveURL(/.*dashboard/);
}

test.describe("NexDesk Enterprise IT Service Desk End-to-End Suite", () => {
  test("1. Login page displays demo account personas and policy links", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1:has-text('NEXDESK')")).toBeVisible();
    await expect(page.locator("text=Internal IT Operations & Incident Management")).toBeVisible();
    await expect(page.locator("text=Alex Vance")).toBeVisible();
    await expect(page.locator("text=Elena Rostova")).toBeVisible();
    await expect(page.locator("text=Privacy Notice")).toBeVisible();
    await expect(page.locator("text=Security & Data Handling")).toBeVisible();
  });

  test("2. Authenticate as Administrator and verify Dashboard metrics", async ({ page }) => {
    await loginAs(page, "Alex Vance");

    await expect(page.locator("text=IT Operations Dashboard")).toBeVisible();
    await expect(page.locator("text=Open Incidents")).toBeVisible();
    await expect(page.locator("text=SLA Compliance")).toBeVisible();
  });

  test("3. Global search modal triggers on Ctrl+K and returns live results", async ({ page }) => {
    await loginAs(page, "Alex Vance");

    // Trigger search
    await page.keyboard.press("Control+k");
    await expect(page.locator("input[placeholder*='Search tickets']")).toBeVisible();

    // Type query
    await page.fill("input[placeholder*='Search tickets']", "VPN");
    await page.waitForTimeout(600);

    // Verify search matches
    await expect(page.locator("text=INC-1001").first()).toBeVisible();
  });

  test("4. View All Incidents and inspect Ticket Detail timeline", async ({ page }) => {
    await loginAs(page, "Alex Vance");

    await page.goto("/tickets");
    await expect(page.locator("h2:has-text('All Incidents & Tickets')")).toBeVisible();
    await expect(page.locator("text=INC-1001").first()).toBeVisible();

    // Click on ticket
    await page.click("text=INC-1001");
    await expect(page).toHaveURL(/.*tickets\/.*/);
    await expect(page.locator("text=Core VPN Gateway unreachable").first()).toBeVisible();
    await expect(page.locator("text=Service Level Agreement").first()).toBeVisible();
  });

  test("5. IT Assets inventory page displays hardware and CSV export capability", async ({ page }) => {
    await loginAs(page, "Alex Vance");

    await page.goto("/assets");
    await expect(page.locator("h2:has-text('IT Hardware & Asset Inventory')")).toBeVisible();
    await expect(page.locator("text=AST-1041").first()).toBeVisible();
    await expect(page.locator("text=ThinkPad X1 Carbon").first()).toBeVisible();
    await expect(page.locator("text=Export CSV")).toBeVisible();
  });

  test("6. Knowledge Base search and troubleshooting checklist interaction", async ({ page }) => {
    await loginAs(page, "Alex Vance");

    await page.goto("/knowledge-base");
    await expect(page.locator("text=Enterprise Knowledge Base & SOPs")).toBeVisible();
    await expect(page.locator("text=Resolving GlobalProtect VPN Connection").first()).toBeVisible();

    // Open article
    await page.click("text=Resolving GlobalProtect VPN Connection");
    await expect(page).toHaveURL(/.*knowledge-base\/vpn-connection-failures-troubleshooting/);
    await expect(page.locator("text=Step-by-Step Remediation Checklist").first()).toBeVisible();
    await expect(page.locator("text=Did this article resolve your technical issue?").first()).toBeVisible();
  });

  test("7. Employee profile reflects assigned workstation devices", async ({ page }) => {
    await loginAs(page, "Alex Vance");

    await page.goto("/profile");
    await expect(page.locator("text=Employee Workstation Profile")).toBeVisible();
    await expect(page.locator("text=Assigned Corporate Hardware")).toBeVisible();
  });

  test("8. Privacy Notice and Security Architecture pages are accessible", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("text=Privacy Notice")).toBeVisible();
    await expect(page.locator("text=HttpOnly")).toBeVisible();

    await page.goto("/security");
    await expect(page.locator("text=Security & Data Handling Architecture")).toBeVisible();
    await expect(page.locator("text=Server-Side Authorization (RBAC)")).toBeVisible();
  });
});
