import "dotenv/config";
import { PlaywrightCrawler } from "crawlee";

const crawler = new PlaywrightCrawler({
  async requestHandler({ page }) {
    await page.locator("input[name=email]").fill(process.env.USERNAME || "");
    await page.locator("input[name=password]").fill(process.env.PASSWORD || "");
    await page.locator("[type=submit]").click();
    await page.locator("nav").getByText("Utilisateurs").click();
    await page.getByRole("tab", { name: "Tous" }).click();
    const requestPromise = page.waitForRequest(/\/members/);
    await page
      .getByRole("button", {
        name: "CHARGER LES UTILISATEURS DE LA SAISON",
      })
      .click();
    const membersRequest = await requestPromise;
    const members = await (await membersRequest.response())?.json();
    const emails = members?.map((m) => m.email);
    console.log(emails);
  },
  headless: false,
});

await crawler.run(["https://usob.monclub.app/authentication"]);
