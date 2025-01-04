import pw, { Browser, BrowserContext, Page } from 'playwright'

import { DEFAULT_TIMEOUT } from './constants'

export async function launchBrowser(): Promise<{
	browser: Browser
	context: BrowserContext
	page: Page
}> {
	const browser = await pw.chromium.launch({
		headless: false,
		args: ['--start-maximized'],
	})
	const context = await browser.newContext({
		viewport: null,
	})
	const page = await context.newPage()

	context.setDefaultTimeout(DEFAULT_TIMEOUT)

	return { browser, context, page }
}
