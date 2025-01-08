import retry from 'async-retry'

import { launchBrowser } from './lib/playwright'
import { scrapBirlaOpusColors } from './lib/scrapper'

const main = async () => {
	console.log('🟢 Connecting to Scrapaint...')
	const { browser, context, page } = await launchBrowser()

	await scrapBirlaOpusColors(page)

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
