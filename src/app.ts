import { loadConfig } from "./config/load-config.ts";
import { scrapeArticlesWithPagination } from "./scrapping/scrapping.ts"
import { APIGatewayEvent, Context, Handler } from "aws-lambda"
export const scraperConfig = loadConfig();


const handler: Handler = async (event: APIGatewayEvent, contex: Context) => {


  async function main() {
    await scrapeArticlesWithPagination(scraperConfig.pageToScrapUrl)
  }
  await main()


  return {
    statusCode: 200,
    body: JSON.stringify({ messae: "Scraping finalizado" })
  }
}




