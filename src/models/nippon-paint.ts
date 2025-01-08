import { Locator, Page } from 'playwright'

import { NIPPON_PAINT_URL } from '../lib/constants'
import { writeJSONFile } from '../lib/file'
import { getUniqueColors } from '../lib/helpers'
import { IScrapper } from '../lib/interfaces'
import { ColorData } from '../lib/types'

export class NipponPaint implements IScrapper {
	private readonly url: string
	private readonly page: Page

	constructor(page: Page) {
		this.url = NIPPON_PAINT_URL
		this.page = page
	}

	async scrap() {
		try {
			console.log('🤝 Connected to Nippon Paint website...')
			await this.page.goto(this.url)

			console.log('🪛 Scrapping website content...')
			const colors: ColorData[] = []
			const pageIds = await this.getPageIds()
			for (const pageId of pageIds) {
				await this.page.goto(`${this.url}${pageId}`)

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
			writeJSONFile(getUniqueColors(colors), 'nippon-paint-colors.json')
		} catch (error) {
			console.log('🔴 Something bad happen:', error)
			await this.page.close()

			throw error
		}
	}

	private async getPageIds(): Promise<string[]> {
		const pageIds: string[] = []
		const anchorLocators = await this.page
			.locator('.colour-family > div > ul > li > a')
			.all()
		for (const anchorLocator of anchorLocators) {
			const pageId = (
				(await anchorLocator.getAttribute('href')) as string
			).replace(this.url, '')

			pageIds.push(pageId)
		}

		return pageIds
	}

	private async getPaletteLocators(): Promise<Locator[]> {
		return await this.page.locator('.card').all()
	}

	private async parsePaletteLocatorToColorData(
		paletteLocator: Locator
	): Promise<ColorData> {
		const hexCode =
			'#' +
			(
				(await paletteLocator
					.locator('.card-image > .overlay-image > img')
					.getAttribute('class')) as string
			).split('ci_')[1]
		const [name, code] = (
			(await paletteLocator.locator('.card-body').allInnerTexts()) as string[]
		)[0].split('\n\n')

		return { name, code, hexCode }
	}
}
