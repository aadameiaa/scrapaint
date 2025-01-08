import { Locator, Page } from 'playwright'

import { DULUX_URL } from '../lib/constants'
import { writeJSONFile } from '../lib/file'
import { getUniqueColors } from '../lib/helpers'
import { IScrapper } from '../lib/interfaces'
import { ColorData } from '../lib/types'

export class Dulux implements IScrapper {
	private readonly url: string
	private readonly page: Page

	constructor(page: Page) {
		this.url = DULUX_URL
		this.page = page
	}

	async scrap() {
		try {
			console.log('🤝 Connected to Dulux website...')
			await this.page.goto(this.url)

			console.log('🪛 Scrapping website content...')
			await this.reset()

			const colors: ColorData[] = []
			const pageIds = await this.getPageIds()
			for (const pageId of pageIds) {
				await this.page.goto(
					`${this.url}/filters/${encodeURIComponent(pageId)}`
				)

				const colorsInPage: ColorData[] = []
				const paletteLocators = await this.getPaletteLocators()
				for (const paletteLocator of paletteLocators) {
					const color = await this.parsePaletteLocatorToColorData(
						paletteLocator
					)

					colorsInPage.push(color)
				}

				colors.push(...colorsInPage)
			}

			console.log('📄 Write website content into file...')
			writeJSONFile(getUniqueColors(colors), 'dulux-colors.json')
		} catch (error) {
			console.log('🔴 Something bad happen:', error)
			await this.page.close()

			throw error
		}
	}

	private async reset() {
		await this.page.getByRole('button', { name: 'Accept All Cookies' }).click()
	}

	private async getPageIds(): Promise<string[]> {
		const pageIds: string[] = []
		const buttonLocators = await this.page
			.locator('button[class^="a20-color-box"]')
			.all()
		for (const buttonLocator of buttonLocators) {
			const pageId = ('h_' +
				(await buttonLocator.getAttribute('data-id'))) as string

			pageIds.push(pageId)
		}

		return pageIds
	}

	private async getPaletteLocators(): Promise<Locator[]> {
		return await this.page
			.locator('div[class^="item"] > div[class^="m7-color-card"]')
			.all()
	}

	private async parsePaletteLocatorToColorData(
		paletteLocator: Locator
	): Promise<ColorData> {
		const hexCode = (await paletteLocator.getAttribute('data-hex')) as string
		const name = (await paletteLocator.getAttribute('data-label')) as string
		const code = (await paletteLocator.getAttribute('data-ccid')) as string

		return { name, code, hexCode }
	}
}
