import retry from 'async-retry'

import { launchBrowser } from './lib/playwright'
import { scrapDuluxColors } from './lib/scrapper'

const main = async () => {
	console.log('🟡 Connecting to Scrapaint...')
	const { browser, context, page } = await launchBrowser()

	await scrapDuluxColors(page)

	console.log('🔴 Disconnecting to Scrapaint...')
	await context.close()
	await browser.close()
}

const retrying = async () => {
	await retry(main, {
		retries: 3,
		onRetry: (error) => {
			console.log('🟠 Retrying...', error)
		},
	})
}

retrying()
