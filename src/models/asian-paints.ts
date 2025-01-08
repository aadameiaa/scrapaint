import { Locator, Page } from 'playwright'

import { ASIAN_PAINTS_SCROLL_TIMEOUT, ASIAN_PAINTS_URL } from '../lib/constants'
import { writeJSONFile } from '../lib/file'
import { getUniqueColors } from '../lib/helpers'
import { ColorData } from '../lib/types'
import { convertBackgroundColorStyleToHexCode } from '../lib/utils'
import { IScrapper } from './../lib/interfaces'

export class AsianPaints implements IScrapper {
	private readonly url: string
	private readonly page: Page

	constructor(page: Page) {
		this.url = ASIAN_PAINTS_URL
		this.page = page
	}

	async scrap() {
		try {
			console.log('🤝 Connected to Dulux website...')
			await this.page.goto(this.url)

			console.log('🪛 Scrapping website content...')
			await this.infiniteScroll()

			const colors: ColorData[] = []
			const paletteLocators = await this.getPaletteLocators()
			for (const paletteLocator of paletteLocators) {
				const color = await this.parsePaletteLocatorToColorData(paletteLocator)

				colors.push(color)
			}

			console.log('📄 Write website content into file...')
			writeJSONFile(getUniqueColors(colors), 'asian-paints-colors.json')
		} catch (error) {
			console.log('🔴 Something bad happen:', error)
			await this.page.close()

			throw error
		}
	}

	private async infiniteScroll() {
		const loadMoreButtonLocator = this.page.locator(
			'button[class*="loadMoreBtn"]'
		)
		do {
			await loadMoreButtonLocator.scrollIntoViewIfNeeded()
			await loadMoreButtonLocator.click()
			await this.page.waitForTimeout(ASIAN_PAINTS_SCROLL_TIMEOUT)
		} while (await loadMoreButtonLocator.isVisible())
	}

	private async getPaletteLocators(): Promise<Locator[]> {
		return await this.page
			.locator('li[class*="cardList"] > a[class*="cardWp"]')
			.all()
	}

	private async parsePaletteLocatorToColorData(
		paletteLocator: Locator
	): Promise<ColorData> {
		const hexCode = convertBackgroundColorStyleToHexCode(
			await paletteLocator
				.locator('div[class*="card"]')
				.evaluate((element) => window.getComputedStyle(element).backgroundColor)
		)
		const [name, code] = (await paletteLocator.allInnerTexts())[0].split(
			' \n\n'
		)

		return { name, code, hexCode }
	}
}
