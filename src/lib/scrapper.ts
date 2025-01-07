import { Locator, Page } from 'playwright'

import {
	ASIAN_PAINTS_SCROLL_TIMEOUT,
	ASIAN_PAINTS_URL,
	DULUX_URL,
	JOTUN_SCROLL_TIMEOUT,
	JOTUN_URL,
	NIPPON_PAINT_URL,
} from './constants'
import { writeJSONFile } from './file'
import { getUniqueColors } from './helpers'
import { ColorData } from './types'
import { backgroundColorStyleToHexCode } from './utils'

export async function scrapNipponPaintColors(page: Page) {
	try {
		console.log('🤝 Connected to Nippon Paint website...')
		await page.goto(NIPPON_PAINT_URL)

		console.log('🪛 Scrapping website content...')
		const colors: ColorData[] = []
		const anchorLocators = await page
			.locator('.colour-family > div > ul > li > a')
			.all()
		for (const anchorLocator of anchorLocators) {
			const pageId = (
				(await anchorLocator.getAttribute('href')) as string
			).replace(NIPPON_PAINT_URL, '')

			await page.goto(`${NIPPON_PAINT_URL}${pageId}`)

			const colorsInPage: ColorData[] = []
			const cardLocators = await page.locator('.card').all()
			for (const cardLocator of cardLocators) {
				const color = await parseNipponPaintCardLocatorToColorData(cardLocator)

				colorsInPage.push(color)
			}

			colors.push(...colorsInPage)
		}

		console.log('📄 Write website content into file...')
		writeJSONFile(getUniqueColors(colors), 'nippon-paint-colors.json')
	} catch (error) {
		console.log('🔴 Something bad happen:', error)

		throw error
	}
}

async function parseNipponPaintCardLocatorToColorData(
	cardLocator: Locator
): Promise<ColorData> {
	const hexCode =
		'#' +
		(
			(await cardLocator
				.locator('.card-image > .overlay-image > img')
				.getAttribute('class')) as string
		).split('ci_')[1]
	const [name, code] = (
		(await cardLocator.locator('.card-body').allInnerTexts()) as string[]
	)[0].split('\n\n')

	return { name, code, hexCode }
}

export async function scrapJotunColors(page: Page) {
	try {
		console.log('🤝 Connected to Jotun website...')
		await page.goto(JOTUN_URL)

		console.log('🪛 Scrapping website content...')
		await page.getByRole('button', { name: 'Accept All Cookies' }).click()
		await page.getByRole('button', { name: 'Hapus filter' }).click()
		await page.waitForFunction(() => {
			const url = new URL(window.location.href)

			return !url.searchParams.has('collections')
		})

		await infiniteJotunScroll(page)

		const colors: ColorData[] = []
		const cardLocators = await page
			.locator(
				'div[class="tw-h-full tw-col-span-6 md:tw-col-span-4 xl:tw-col-span-2"]'
			)
			.all()
		for (const cardLocator of cardLocators) {
			const color = await parseJotunCardLocatorToColorData(cardLocator)

			colors.push(color)
		}

		console.log('📄 Write website content into file...')
		writeJSONFile(getUniqueColors(colors), 'jotun-colors.json')
	} catch (error) {
		console.log('🔴 Something bad happen:', error)

		throw error
	}
}

async function infiniteJotunScroll(page: Page) {
	while (true) {
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
		await page.waitForTimeout(JOTUN_SCROLL_TIMEOUT)

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
}

async function parseJotunCardLocatorToColorData(
	cardLocator: Locator
): Promise<ColorData> {
	const [code, name] = (
		(await cardLocator
			.locator('a[href^="/id-id/decorative/interior/colours/"]')
			.allInnerTexts()) as string[]
	)[0].split('\n')
	const hexCode = backgroundColorStyleToHexCode(
		await cardLocator
			.locator(
				'a[href^="/id-id/decorative/interior/colours/"] > div:nth-of-type(1) > div:nth-of-type(1)'
			)
			.evaluate((element) => window.getComputedStyle(element).backgroundColor)
	)

	return { name, code, hexCode }
}

export async function scrapDuluxColors(page: Page) {
	try {
		console.log('🤝 Connected to Dulux website...')
		await page.goto(DULUX_URL)

		console.log('🪛 Scrapping website content...')
		await page.getByRole('button', { name: 'Accept All Cookies' }).click()

		const colors: ColorData[] = []
		const buttonLocators = await page
			.locator('button[class^="a20-color-box"]')
			.all()
		for (const buttonLocator of buttonLocators) {
			await buttonLocator.click()

			const colorsInPage: ColorData[] = []
			const cardLocators = await page
				.locator('div[class^="item"] > div[class^="m7-color-card"]')
				.all()
			for (const cardLocator of cardLocators) {
				const color = await parseDuluxCardLocatorToColorData(cardLocator)

				colorsInPage.push(color)
			}

			colors.push(...colorsInPage)
		}

		console.log('📄 Write website content into file...')
		writeJSONFile(getUniqueColors(colors), 'dulux-colors.json')
	} catch (error) {
		console.log('🔴 Something bad happen:', error)

		throw error
	}
}

async function parseDuluxCardLocatorToColorData(
	cardLocator: Locator
): Promise<ColorData> {
	const hexCode = (await cardLocator.getAttribute('data-hex')) as string
	const name = (await cardLocator.getAttribute('data-label')) as string
	const code = (await cardLocator.getAttribute('data-ccid')) as string

	return { name, code, hexCode }
}

export async function scrapAsianPaintsColors(page: Page) {
	try {
		console.log('🤝 Connected to Dulux website...')
		await page.goto(ASIAN_PAINTS_URL)

		console.log('🪛 Scrapping website content...')
		await infiniteAsianPaintsColors(page)

		const colors: ColorData[] = []
		const cardLocators = await page
			.locator('li[class*="cardList"] > a[class*="cardWp"]')
			.all()

		for (const cardLocator of cardLocators) {
			const color = await parseAsianPaintsCardLocatorToColorData(cardLocator)

			colors.push(color)
		}

		console.log('📄 Write website content into file...')
		writeJSONFile(getUniqueColors(colors), 'asian-paints-colors.json')
	} catch (error) {
		console.log('🔴 Something bad happen:', error)

		throw error
	}
}

async function infiniteAsianPaintsColors(page: Page) {
	const loadMoreButtonLocator = page.locator('button[class*="loadMoreBtn"]')
	do {
		await loadMoreButtonLocator.scrollIntoViewIfNeeded()
		await loadMoreButtonLocator.click()
		await page.waitForTimeout(ASIAN_PAINTS_SCROLL_TIMEOUT)
	} while (await loadMoreButtonLocator.isVisible())
}

async function parseAsianPaintsCardLocatorToColorData(
	cardLocator: Locator
): Promise<ColorData> {
	const hexCode = backgroundColorStyleToHexCode(
		await cardLocator
			.locator('div[class*="card"]')
			.evaluate((element) => window.getComputedStyle(element).backgroundColor)
	)
	const [name, code] = (await cardLocator.allInnerTexts())[0].split(' \n\n')

	return { name, code, hexCode }
}
