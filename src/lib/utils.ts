export function convertBackgroundColorStyleToHexCode(
	backgroundColor: string
): string {
	return backgroundColor
		.replace('rgb(', '')
		.replace(')', '')
		.split(', ')
		.reduce((hex, value) => hex + Number(value).toString(16).toUpperCase(), '#')
}
