import { Locator, Page } from 'playwright'

import { JOTUN_SCROLL_TIMEOUT, JOTUN_URL } from '../lib/constants'
import { writeJSONFile } from '../lib/file'
import { getUniqueColors } from '../lib/helpers'
import { IScrapper } from '../lib/interfaces'
import { ColorData } from '../lib/types'
import { convertBackgroundColorStyleToHexCode } from '../lib/utils'

export class Jotun implements IScrapper {
	private readonly url: string
	private readonly page: Page

	constructor(page: Page) {
		this.url = JOTUN_URL
		this.page = page
	}

	async scrap() {
		try {
			console.log('🤝 Connected to Jotun website...')
			await this.page.goto(this.url)

			console.log('🪛 Scrapping website content...')
			await this.reset()
			await this.infiniteScroll()

			const colors: ColorData[] = []
			const paletteLocators = await this.getPaletteLocators()
			for (const paletteLocator of paletteLocators) {
				const color = await this.parsePaletteLocatorToColorData(paletteLocator)

				colors.push(color)
			}

			console.log('📄 Write website content into file...')
			writeJSONFile(getUniqueColors(colors), 'jotun-colors.json')
		} catch (error) {
			console.log('🔴 Something bad happen:', error)
			await this.page.close()

			throw error
		}
	}

	private async reset() {
		await this.page.getByRole('button', { name: 'Accept All Cookies' }).click()
		await this.page.getByRole('button', { name: 'Hapus filter' }).click()
		await this.page.waitForFunction(() => {
			const url = new URL(window.location.href)

			return !url.searchParams.has('collections')
		})
	}

	private async infiniteScroll() {
		while (true) {
			await this.page.evaluate(() =>
				window.scrollTo(0, document.body.scrollHeight)
			)
			await this.page.waitForTimeout(JOTUN_SCROLL_TIMEOUT)

			const totalColorsLabel = (await this.page
				.getByText(/Menampilkan .* dari .* warna/)
				.textContent()) as string
			const [currentTotalColors, availableTotalColors] = totalColorsLabel
				.replace('Menampilkan ', '')
				.replace(' warna', '')
				.split(' dari ')

			if (currentTotalColors === availableTotalColors) {
				break
			}
		}
	}

	private async getPaletteLocators(): Promise<Locator[]> {
		return await this.page
			.locator(
				'div[class="tw-h-full tw-col-span-6 md:tw-col-span-4 xl:tw-col-span-2"]'
			)
			.all()
	}

	private async parsePaletteLocatorToColorData(
		paletteLocator: Locator
	): Promise<ColorData> {
		const [code, name] = (
			(await paletteLocator
				.locator('a[href^="/id-id/decorative/interior/colours/"]')
				.allInnerTexts()) as string[]
		)[0].split('\n')
		const hexCode = convertBackgroundColorStyleToHexCode(
			await paletteLocator
				.locator(
					'a[href^="/id-id/decorative/interior/colours/"] > div:nth-of-type(1) > div:nth-of-type(1)'
				)
				.evaluate((element) => window.getComputedStyle(element).backgroundColor)
		)

		return { name, code, hexCode }
	}
}
