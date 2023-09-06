import "dotenv/config";
import { PlaywrightCrawler } from "crawlee";
import { users } from "./schema";
import db from "./db";
import { sql } from "drizzle-orm";
import https from "https";

interface Member {
  email: string;
}

const notify = async () => {
  const url = new URL(process.env.PIPEDREAM_WORKFLOW_URL || "");
  const data = JSON.stringify({});
  const request = https.request({
    hostname: url.host,
    port: url.port,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  });
  request.write(data);
  request.end();
};

const crawler = new PlaywrightCrawler({
  async requestHandler({ page, log }) {
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
    const members: Member[] = await (await membersRequest.response())?.json();
    const emails = members?.map((m) => m.email);

    const currentMembers = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users);

    if (currentMembers[0].count !== emails.length) {
      log.info("Inserting new members");
      await db
        .insert(users)
        .values(emails.map((email) => ({ email })))
        .onConflictDoNothing();
      await notify();
    }
  },
});

await crawler.run(["https://usob.monclub.app/authentication"]);
