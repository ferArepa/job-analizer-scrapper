import { chromium } from 'playwright'
import * as fs from 'fs'
import { Post } from "../interfaces/post.interface.ts";
import { doAnalisisOfOffers } from '../bot/llm.ts';
import { parseDate } from '../common/parse-date.ts';




export async function scrapeArticlesWithPagination(url: string) {
  const browser = await chromium.launch({ headless: true });
  const page: any = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
  });

  const datosExtraidos: Post[] = [];
  let paginaActual = 1;
  const selectorBotonSiguiente = 'span.b_primary.w48.buildLink.cp';

  try {
    console.log(`Navegando a la URL inicial: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    while (true) {
      console.log(`\n==========================================`);
      console.log(`| COMENZANDO SCRAPING DE PÁGINA ${paginaActual} |`);
      console.log(`==========================================`);

      const nuevosDatos = await scrapePage(page, paginaActual);
      datosExtraidos.push(...nuevosDatos); 

      console.log(`Artículos extraídos en la página ${paginaActual}: ${nuevosDatos.length}`);

      const botonSiguiente = page.locator(selectorBotonSiguiente);
      const existeBoton = await botonSiguiente.isVisible();

      if (existeBoton) {
        console.log(`Haciendo click en "Siguiente" para ir a la página ${paginaActual + 1}...`);

        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
          botonSiguiente.click()
        ]);

        paginaActual++;

      } else {
        console.log(`\nEl botón "Siguiente" no se encontró. Fin de la paginación.`);
        break;
      }
    }

    console.log('\n--- Extracción TOTAL finalizada ---');
    console.log(`Total de artículos extraídos: ${datosExtraidos.length}`);

  } catch (e) {
    console.error('Error general durante la ejecución del scraping:', e);
  } finally {
    console.log(datosExtraidos)

    const date = new Date()

    fs.writeFileSync(
      `src/extracted_data/extracted_${parseDate(date)}.txt`,
      JSON.stringify(datosExtraidos, null, 3)
    )

    await doAnalisisOfOffers(date)

    await browser.close();
  }
}

export async function scrapePage(page: any, pageNumber: number): Promise<Post[]> {
  const datosPagina = [];
  const selectorArticulos = 'article';

  // 1. Asegurar que la lista de artículos está cargada
  await page.waitForSelector(selectorArticulos, { state: 'visible' });

  // 2. Obtener el número total de artículos en esta página
  const conteoArticulos = await page.locator(selectorArticulos).count();

  console.log(`Artículos encontrados en la página ${pageNumber}: ${conteoArticulos}`);

  // 3. Iterar sobre el conteo para evitar referencias obsoletas (stale elements)
  for (let i = 0; i < conteoArticulos; i++) {
    const articuloLocator = page.locator(selectorArticulos).nth(i);

    // Obtener un título temporal para el log antes de hacer click
    const tituloArticulo = await articuloLocator.locator('h1, h2, h3').first().innerText().catch(() => `Artículo ${i + 1}`);

    try {
      // 4. Hacer click en el elemento <article> y esperar la redirección
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }), // Espera la carga de la página de detalle
        articuloLocator.click()
      ]);

      const selectorDinamico = '.fs16.t_word_wrap';

      // 5. Esperar el contenido dinámico en la NUEVA página
      await page.waitForSelector(selectorDinamico, { state: 'visible', timeout: 10000 });

      // 6. Obtener y limpiar el texto
      const textoDinamicoCrudo = await page.locator(selectorDinamico).first().innerText();
      const textoLimpio = textoDinamicoCrudo
        .replace(/(\r\n|\n|\r|\t)/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // 7. Guardar los datos
      datosPagina.push({
        pagina: pageNumber,
        indice: i + 1,
        titulo: tituloArticulo,
        url: page.url(),
        contenido_dinamico: textoLimpio
      });

    } catch (error: any) {
      console.error(`  -> ERROR (Pág ${pageNumber}, Art ${i + 1}) al extraer contenido: ${error.message}`);
    }

    // 8. VOLVER a la página de resultados para la siguiente iteración
    await page.goBack();
    // Asegurarse de que la lista de artículos se recargue antes de continuar
    await page.waitForSelector(selectorArticulos, { state: 'visible' });
  }

  return datosPagina;
}