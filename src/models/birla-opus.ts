import { Locator, Page } from 'playwright'

import { BIRLA_OPUS_URL } from '../lib/constants'
import { writeJSONFile } from '../lib/file'
import { getUniqueColors } from '../lib/helpers'
import { IScrapper } from '../lib/interfaces'
import { ColorData } from '../lib/types'
import { convertBackgroundColorStyleToHexCode } from '../lib/utils'

export class BirlaOpus implements IScrapper {
	private readonly url: string
	private readonly page: Page

	constructor(page: Page) {
		this.url = BIRLA_OPUS_URL
		this.page = page
	}

	async scrap() {
		try {
			console.log('🤝 Connected to Dulux website...')
			await this.page.goto(this.url)

			console.log('🪛 Scrapping website content...')
			const colors: ColorData[] = []
			const pageIds = await this.getPageIds()
			for (const pageId of pageIds) {
				await this.page.goto(`${this.url}${pageId}`)

				const colorsInPage: ColorData[] = []
				const paletteLocators = await this.getPaletteLocators(pageId)
				for (const paletteLocator of paletteLocators) {
					const color = await this.parsePaletteLocatorToColorData(
						paletteLocator
					)

					colorsInPage.push(color)
				}

				colors.push(...colorsInPage)
			}

			console.log('📄 Write website content into file...')
			writeJSONFile(getUniqueColors(colors), 'birla-opus-colors.json')
		} catch (error) {
			console.log('🔴 Something bad happen:', error)
			await this.page.close()

			throw error
		}
	}

	private async getPageIds(): Promise<string[]> {
		const linkLocators = await this.page
			.locator(
				'div[class="colour-swatch-title"] > div[class="cta-wrap"] > a[class="colour-swatch-view-more"]'
			)
			.all()
		const pageIds: string[] = []
		for (const linkLocator of linkLocators) {
			const pageId = (
				(await linkLocator.getAttribute('href')) as string
			).replace('/colour-catalogue', '')

			pageIds.push(pageId)
		}

		return pageIds
	}

	private async getPaletteLocators(pageId: string): Promise<Locator[]> {
		return await this.page
			.locator(
				`a[class="colour-swatch-card colour-popover"][href*="${pageId}"]`
			)
			.all()
	}

	private async parsePaletteLocatorToColorData(
		paletteLocator: Locator
	): Promise<ColorData> {
		const name = (await paletteLocator.getAttribute('data-colorname')) as string
		const code = (await paletteLocator.getAttribute('data-colorcode')) as string
		const hexCode = convertBackgroundColorStyleToHexCode(
			await paletteLocator.evaluate(
				(element) => window.getComputedStyle(element).backgroundColor
			)
		)

		return { name, code, hexCode }
	}
}
