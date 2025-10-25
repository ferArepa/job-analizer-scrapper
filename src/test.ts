import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from "aws-lambda";
import { scrapeArticlesWithPagination } from "./scrapping/scrapping";
import { scraperConfig } from "./app";


const s3Client = new S3Client({ region: "us-east-1" });

const handler: APIGatewayProxyHandler = async (event, context) => {

  const datosScrapeados = await scrapeArticlesWithPagination(scraperConfig.pageToScrapUrl);
  const contenidoArchivo = JSON.stringify(datosScrapeados, null, 2);

  const BUCKET_NAME = "mis-ofertas-scrapeas-2025";
  const FILE_KEY = `ofertas/${new Date().toISOString()}.json`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: FILE_KEY,
      Body: contenidoArchivo, // El contenido a subir
      ContentType: "application/json"
    });

    await s3Client.send(command);
    console.log(`Archivo guardado exitosamente en s3://${BUCKET_NAME}/${FILE_KEY}`);

  } catch (error) {
    console.error("Error al subir a S3:", error);
    throw new Error("Fallo al persistir resultados en S3.");
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Scraping y guardado en S3 finalizado",
      s3Path: `s3://${BUCKET_NAME}/${FILE_KEY}`
    })
  };
}