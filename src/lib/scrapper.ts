import { Page } from 'playwright'

import { NIPPON_PAINT_URL } from './constants'
import { writeJSONFile } from './file'
import { getUniqueColors } from './helpers'
import { ColorData } from './types'

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

	const uniqueColors = getUniqueColors(colors)

	writeJSONFile(uniqueColors, 'nippon-paint-colors.json')
}
