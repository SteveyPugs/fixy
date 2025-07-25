const internals = {}
const { format: formatDate, parse: parseDate, isValid } = require('date-fns')
const Papa = require('papaparse')

// Secure string splice utility function
const stringSplice = (str, idx, rem, newStr) => {
	return str.slice(0, idx) + newStr + str.slice(idx + Math.abs(rem))
}

const parseCol = (row, map, format = 'json') => {
	const r = {}
	for (const { name, width, start, type, ...field } of map) {
		const v = row.substring(start - 1, (start + width - 1)).trim()
		if (v) {
			switch (type) {
				case 'date': {
					try {
						let parsedDate
						if (field.inputformat) {
							// Convert moment format to date-fns format
							const dateFnsInputFormat = field.inputformat.replace(/YYYY/g, 'yyyy').replace(/MM/g, 'MM').replace(/DD/g, 'dd')
							parsedDate = parseDate(v, dateFnsInputFormat, new Date())
						} else {
							parsedDate = new Date(v)
						}
						if (isValid(parsedDate)) {
							const dateFnsOutputFormat = field.outputformat.replace(/YYYY/g, 'yyyy').replace(/MM/g, 'MM').replace(/DD/g, 'dd')
							r[name] = formatDate(parsedDate, dateFnsOutputFormat)
						} else {
							r[name] = null
						}
					} catch (e) {
						r[name] = null
					}
					break
				}
				case 'float': {
					const precision = field.precision || field.percision || 2 // Support backward compatibility
					const symbol = (field.symbol && format === 'csv') ? field.symbol : ''
					if (v.includes('.')) {
						r[name] = symbol + parseFloat(v).toFixed(precision)
					} else {
						r[name] = symbol + parseFloat(stringSplice(v, width - precision, 0, '.')).toFixed(precision)
					}
					break
				}
				case 'int':
					r[name] = parseInt(v)
					break
				case 'bool':
					r[name] = v === field.tVal
					break
				case 'string':
					r[name] = v
					break
				default:
					r[name] = v
			}
		} else {
			r[name] = null
		}
	}
	return r
}

internals.parse = (specs, input) => {
	if (typeof specs !== 'object') throw new Error('specs must be an object')
	if (!specs || Object.keys(specs).length === 0) throw new Error('specs cannot be empty')
	if (!specs.map || specs.map.length === 0) throw new Error('specs.map cannot be empty')
	if (!specs.options || Object.keys(specs.options).length === 0) throw new Error('specs.options cannot be empty')
	if (input === '') throw new Error('input cannot be empty')
	specs = startCheck(specs)
	const arrayOutput = []
	const objectOutput = {}
	const splitInput = input.replace(/\r\n/g, '\n').split('\n').filter(line => line !== '')
	for (let idx = 0; idx < splitInput.length; idx++) {
		const i = splitInput[idx]
		if (i.length === specs.options.fullwidth && !specs.options.levels) {
			if (specs.options.skiplines && specs.options.skiplines.length > 0) {
				if (!specs.options.skiplines.includes(idx + 1)) {
					arrayOutput.push(parseCol(i, specs.map, specs.options.format))
				}
			} else {
				arrayOutput.push(parseCol(i, specs.map, specs.options.format))
			}
		} else if (specs.options.levels) {
			const level = Object.values(specs.options.levels).find(v => idx >= v.start && idx <= v.end)
			const levelKey = Object.keys(specs.options.levels).find(key => {
				const v = specs.options.levels[key]
				return idx >= v.start && idx <= v.end
			})
			const levelMap = specs.map.filter(item => item.level === levelKey)
			if (i.length === level.fullwidth) {
				if (!(level.nickname in objectOutput)) {
					objectOutput[level.nickname] = []
				}
				if (specs.options.skiplines && specs.options.skiplines.length > 0) {
					if (!specs.options.skiplines.includes(idx + 1)) {
						objectOutput[level.nickname].push(parseCol(i, levelMap, specs.options.format))
					}
				} else {
					objectOutput[level.nickname].push(parseCol(i, levelMap, specs.options.format))
				}
			} else {
				throw new Error(`Row #${idx + 1} does not match fullwidth`)
			}
		} else {
			throw new Error(`Row #${idx + 1} does not match fullwidth`)
		}
	}
	switch (specs.options.format) {
		case 'csv':
			if (arrayOutput.length === 0) {
				throw new Error('Multi-Level Maps Cannot Convert to CSV')
			} else {
				return Papa.unparse(arrayOutput.length > 0 ? arrayOutput : objectOutput, {
					newline: '\n'
				})
			}
		default:
			return arrayOutput.length > 0 ? arrayOutput : objectOutput
	}
}

internals.unparse = (specs, input, levels) => {
	let output = ''
	if (typeof specs !== 'object') throw new Error('specs must be an object')
	if (!specs || specs.length === 0) throw new Error('specs cannot be empty')
	if (input === '') throw new Error('input cannot be empty')
	let counter = 0
	if (levels) {
		let rowCount = 0
		for (const l of levels) {
			const inputByLevel = input[l]
			rowCount += inputByLevel.length
		}
		for (const l of levels) {
			const inputByLevel = input[l]
			const specsByLevel = specs.filter(spec => spec.level === l)
			for (const inp of inputByLevel) {
				for (const spec of specsByLevel) {
					let value = String(inp[spec.name])
					value = preprocessCheck(spec, value, inp)

					const valueLength = value.length
					if (spec.width - value.length >= 0) {
						for (let i = 1; i <= spec.width - valueLength; i++) {
							const symbol = spec.padding_symbol || ' '
							if (symbol.length > 1) throw new Error('padding_symbol cannot have length > 1')
							switch (spec.padding_position) {
								case 'start':
									value = symbol + value
									break
								case 'end':
									value = value + symbol
									break
								default:
									value = symbol + value
									break
							}
						}
						output += value.substring(0, spec.width)
					}
				}
				counter++
				if (rowCount !== counter) {
					output += '\n'
				}
			}
		}
		return output
	} else {
		for (const row in input) {
			for (const spec in specs) {
				let value = input[row][specs[spec].name]
				const defaultValue = specs[spec].default != null ? specs[spec].default : ''
				value = value != null ? value : defaultValue
				value = String(value)
				value = preprocessCheck(specs[spec], value, input[row])
				const valueLength = value.length
				if (specs[spec].width - value.length >= 0) {
					for (let i = 1; i <= specs[spec].width - valueLength; i++) {
						const symbol = specs[spec].padding_symbol || ' '
						if (symbol.length > 1) throw new Error('padding_symbol cannot have length > 1')
						switch (specs[spec].padding_position) {
							case 'start':
								value = symbol + value
								break
							case 'end':
								value = value + symbol
								break
							default:
								value = symbol + value
								break
						}
					}
				}
				output += value.substring(0, specs[spec].width)
			}
			counter++
			if (input.length !== counter) {
				output += '\n'
			}
		}
		return output
	}
}

const preprocessCheck = (spec, value, row) => spec.preprocess ? spec.preprocess(value, row) : value

const startCheck = (specs) => {
	let nextStart = 1
	return {
		...specs,
		map: specs.map.map(col => {
			const start = col.start || nextStart
			nextStart = start + col.width
			return { ...col, start }
		})
	}
}

module.exports = internals
