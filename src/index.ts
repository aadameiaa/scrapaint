import retry from 'async-retry'

import { IScrapper } from './lib/interfaces'
import { launchBrowser } from './lib/playwright'
import { Jotun } from './models/jotun'

const main = async () => {
	console.log('🟢 Connecting to Scrapaint...')
	const { browser, context, page } = await launchBrowser()

	const scrapper: IScrapper = new Jotun(page)

	await scrapper.scrap()

	console.log('🔴 Disconnecting from Scrapaint...\n')
	await context.close()
	await browser.close()
}

const retrying = async () => {
	await retry(main, {
		retries: 3,
		onRetry: async (error) => {
			console.log('🟠 Retrying...', error)
		},
	})
}

retrying()
