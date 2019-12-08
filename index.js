var internals = {}
var moment = require('moment')
var Papa = require('papaparse')
var lodash = require('lodash')

// eslint-disable-next-line no-extend-native
String.prototype.splice = function (idx, rem, str) {
	return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem))
}

var parseCol = function (row, map, format) {
	var r = {}
	lodash.forEach(map, function (i) {
		var v = row.substring(i.start - 1, (i.start + i.width - 1)).trim()
		if (v) {
			switch (i.type) {
				case 'date':
					if (i.inputformat) {
						if (moment(v, i.inputformat).isValid()) {
							r[i.name] = moment(v, i.inputformat).format(i.outputformat)
						} else {
							r[i.name] = null
						}
					} else {
						if (moment(v).isValid()) {
							r[i.name] = moment(v).format(i.outputformat)
						} else {
							r[i.name] = null
						}
					}
					break
				case 'float':
					var precision = 2
					if (i.percision) { // Support incorrect spelling for backward compatibility
						precision = i.percision
					}
					if (i.precision) {
						precision = i.precision
					}
					var symbol = ''
					if (i.symbol && format === 'csv') {
						symbol = i.symbol
					}
					if (lodash.includes(v, '.')) {
						r[i.name] = symbol + parseFloat(v).toFixed(precision)
					} else {
						r[i.name] = symbol + parseFloat(v.splice(i.width - precision, 0, '.')).toFixed(precision)
					}
					break
				case 'int':
					r[i.name] = parseInt(v)
					break
				case 'bool':
					r[i.name] = false
					if (v === i.tVal) {
						r[i.name] = true
					}
					break
				case 'string':
					r[i.name] = v
					break
				default:
					r[i.name] = v
			}
		} else {
			r[i.name] = null
		}
	})
	return r
}

internals.parse = function (specs, input) {
	if (typeof (specs) !== 'object') throw new Error('specs is not an array')
	if (lodash.isEmpty(specs)) throw new Error('specs is empty')
	if (lodash.isEmpty(specs.map)) throw new Error('specs maps is empty')
	if (lodash.isEmpty(specs.options)) throw new Error('specs options is empty')
	if (input === '') throw new Error('input is empty')
	specs = startCheck(specs)
	var arrayOutput = []
	var objectOutput = {}
	var splitInput = input.replace(/\r\n/g, '\n').split('\n')
	if (splitInput.indexOf('') !== -1) {
		splitInput.splice(splitInput.indexOf(''), 1)
	}
	lodash.forEach(splitInput, function (i, idx) {
		if (i.length === specs.options.fullwidth && !specs.options.levels) {
			if (!lodash.isEmpty(specs.options.skiplines)) {
				if (specs.options.skiplines.indexOf(parseInt(idx) + 1) === -1) {
					arrayOutput.push(parseCol(i, specs.map, specs.options.format))
				}
			} else {
				arrayOutput.push(parseCol(i, specs.map, specs.options.format))
			}
		} else if (specs.options.levels) {
			var level = lodash.find(specs.options.levels, function (v) {
				if (idx >= v.start && idx <= v.end) {
					return true
				}
			})
			var levelMap = lodash.filter(specs.map, {
				level: lodash.findKey(specs.options.levels, function (v) {
					if (idx >= v.start && idx <= v.end) {
						return true
					}
				})
			})
			if (i.length === level.fullwidth) {
				// eslint-disable-next-line no-prototype-builtins
				if (!objectOutput.hasOwnProperty(level.nickname)) {
					objectOutput[level.nickname] = []
				}
				if (specs.options.skiplines !== null) {
					if (specs.options.skiplines.indexOf(parseInt(idx) + 1) === -1) {
						objectOutput[level.nickname].push(parseCol(i, levelMap, specs.options.format))
					}
				} else {
					objectOutput[level.nickname].push(parseCol(i, levelMap, specs.options.format))
				}
			} else {
				throw new Error('Row #' + (parseInt(idx) + 1) + ' does not match fullwidth')
			}
		} else {
			throw new Error('Row #' + (parseInt(idx) + 1) + ' does not match fullwidth')
		}
	})
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

internals.unparse = function (specs, input, levels) {
	var output = []
	if (typeof (specs) !== 'object') throw new Error('specs is not an array')
	if (lodash.isEmpty(specs)) throw new Error('specs is empty')
	if (input === '') throw new Error('input is empty')
	var counter = 0
	if (levels) {
		var rowCount = 0
		lodash.forEach(levels, function (l) {
			var inputByLevel = input[l]
			rowCount = rowCount + inputByLevel.length
		})
		lodash.forEach(levels, function (l) {
			var inputByLevel = input[l]
			var specsByLevel = lodash.filter(specs, {
				level: l
			})
			lodash.forEach(inputByLevel, function (inp) {
				lodash.forEach(specsByLevel, function (spec) {
					var value = String(inp[spec.name])
					value = preprocessCheck(spec, value)

					var valueLength = value.length
					if (spec.width - value.length >= 0) {
						for (var i = 1; i <= spec.width - valueLength; i++) {
							var symbol = spec.padding_symbol ? spec.padding_symbol : ' '
							if (symbol.length > 1) throw new Error('padding_symbol can not have length > 1')
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
						output = output + value.substring(0, spec.width)
					}
				})
				counter = counter + 1
				if (rowCount !== counter) {
					output = output + '\n'
				}
			})
		})
		return output
	} else {
		for (var row in input) {
			for (var spec in specs) {
				var value = input[row][specs[spec].name]
				var defaultValue = lodash.defaultTo(specs[spec].default, '')
				value = lodash.defaultTo(value, defaultValue)
				value = String(value)
				value = preprocessCheck(specs[spec], value)
				var valueLength = value.length
				if (specs[spec].width - value.length >= 0) {
					for (var i = 1; i <= specs[spec].width - valueLength; i++) {
						var symbol = specs[spec].padding_symbol ? specs[spec].padding_symbol : ' '
						if (symbol.length > 1) throw new Error('padding_symbol can not have length > 1')
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
				output = output + value.substring(0, specs[spec].width)
			}
			counter = counter + 1
			if (input.length !== counter) {
				output = output + '\n'
			}
		}
		return output
	}
}

const preprocessCheck = (spec, value) => {
	return (spec.preprocess) ? spec.preprocess(value) : value
}

const startCheck = (specs) => {
	let nextStart = 1
	specs.map.forEach(col => {
		if (!col.start) col.start = nextStart
		nextStart = col.start + col.width
	})
	return specs
}

module.exports = internals
