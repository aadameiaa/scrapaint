import { launchBrowser } from './lib/playwright'
import { scrapNipponPaintColors } from './lib/scrapper'

const main = async () => {
	const { browser, context, page } = await launchBrowser()

	await scrapNipponPaintColors(page)

	await context.close()
	await browser.close()
}

main()
