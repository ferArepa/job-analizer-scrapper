import * as fs from "fs";
import { ScraperConfig } from "../interfaces/config.interface.ts";

export function loadConfig(): ScraperConfig {

  const config = JSON.parse(fs.readFileSync("src/config/config.json", 'utf8')) as ScraperConfig

  return config
}