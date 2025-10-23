import { loadConfig } from "./config/load-config.ts";
import { scrapeArticlesWithPagination } from "./scrapping/scrapping.ts"

export const scraperConfig = loadConfig();


(async () => {
  async function main() {
    await scrapeArticlesWithPagination(scraperConfig.pageToScrapUrl)
  }
  main()
})()

