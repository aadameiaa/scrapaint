import * as fs from 'fs'
import * as path from 'path'

export function readJSONFile(filePath: string) {
	const absolutePath = path.resolve(__dirname, filePath)
	const fileContent = fs.readFileSync(absolutePath, 'utf-8')

	return JSON.parse(fileContent)
}

export function writeJSONFile(data: any, fileName: string) {
	const parentDirPath = path.resolve(__dirname, '../..')
	const dirPath = path.resolve(parentDirPath, 'public/data')
	const filePath = path.join(dirPath, fileName)

	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true })
	}

	fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}
