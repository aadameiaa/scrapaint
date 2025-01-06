import { Page } from 'playwright'

import { JOTUN_URL, NIPPON_PAINT_URL, SCROLL_TIMEOUT } from './constants'
import { writeJSONFile } from './file'
import { getUniqueColors } from './helpers'
import { ColorData } from './types'
import { backgroundColorStyleToHexCode } from './utils'

export async function scrapNipponPaintColors(page: Page) {
	await page.goto(NIPPON_PAINT_URL)

	const pageIds = await page.evaluate<string[], string>((url) => {
		const links = document.querySelectorAll(
			'.colour-family > div > ul > li > a'
		)

		return Array.from(links).map((link) =>
			(link.getAttribute('href') as string).replace(url, '')
		)
	}, NIPPON_PAINT_URL)

	const colors: ColorData[] = []
	for (const pageId of pageIds) {
		await page.goto(`${NIPPON_PAINT_URL}${pageId}`)

		const colorsInPage = await page.evaluate<ColorData[]>(() => {
			function parseDOMToNipponPaintColorDataList(): ColorData[] {
				const cards = document.querySelectorAll('.card')

				return Array.from(cards).map((card) =>
					parseDOMToSingleNipponPaintColorData(card)
				)
			}

			function parseDOMToSingleNipponPaintColorData(
				element: Element
			): ColorData {
				const image = element.querySelector(
					'.card-image > .overlay-image > img'
				) as Element
				const body = element.querySelector('.card-body') as Element

				const hexCode =
					'#' + image.className.split(' ')[1].replace('ci_', '').toUpperCase()
				const name = (
					(body.querySelector('.card-title > a') as Element)
						.textContent as string
				).trim()
				const code = (
					(body.querySelector('p:nth-child(3)') as Element)
						.textContent as string
				).trim()

				return {
					name,
					code,
					hexCode,
				}
			}

			return parseDOMToNipponPaintColorDataList()
		})

		colors.push(...colorsInPage)
	}

	writeJSONFile(getUniqueColors(colors), 'nippon-paint-colors.json')
}

export async function scrapJotunColors(page: Page) {
	await page.goto(JOTUN_URL)

	await page.getByRole('button', { name: 'Accept All Cookies' }).click()
	await page.getByRole('button', { name: 'Hapus filter' }).click()
	await page.waitForFunction(() => {
		const url = new URL(window.location.href)

		return !url.searchParams.has('collections')
	})

	while (true) {
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
		await page.waitForTimeout(SCROLL_TIMEOUT)

		const totalColorsLabel = (await page
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

	const cards = await page
		.locator(
			'div[class="tw-h-full tw-col-span-6 md:tw-col-span-4 xl:tw-col-span-2"]'
		)
		.all()

	const colors: ColorData[] = []
	for (const card of cards) {
		const texts = await card
			.locator('a[href^="/id-id/decorative/interior/colours/"]')
			.allInnerTexts()
		const backgroundColor = await card
			.locator(
				'a[href^="/id-id/decorative/interior/colours/"] > div:nth-of-type(1) > div:nth-of-type(1)'
			)
			.evaluate((element) => window.getComputedStyle(element).backgroundColor)
		const [code, name] = texts[0].split('\n')
		const hexCode = backgroundColorStyleToHexCode(backgroundColor)

		colors.push({ name, code, hexCode })
	}

	writeJSONFile(getUniqueColors(colors), 'jotun-colors.json')
}
