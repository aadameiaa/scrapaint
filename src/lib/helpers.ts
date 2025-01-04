import { ColorData } from './types'

export function getUniqueColors(colors: ColorData[]): ColorData[] {
	return colors.filter(
		(color, index, array) =>
			array.findIndex(
				(obj) =>
					obj.name === color.name &&
					obj.code === color.code &&
					obj.hexCode === color.hexCode
			) === index
	)
}
