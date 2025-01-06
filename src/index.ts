import { launchBrowser } from './lib/playwright'
import { scrapJotunColors } from './lib/scrapper'

const main = async () => {
	const { browser, context, page } = await launchBrowser()

	await scrapJotunColors(page)

	await context.close()
	await browser.close()
}

main()
