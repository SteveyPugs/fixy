var internals = {};
var fs = require("fs");
var moment = require("moment");
var Papa = require("papaparse");
var lodash = require("lodash");

String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}

function returnCol(row, map, format){
	var parsed_row = {};
	for(var item in map){
		var value = row.substring(map[item].start-1, (map[item].start + map[item].width - 1)).trim();
		if(value){
			switch(map[item].type){
				case "date":
					if(map[item].inputformat){
						parsed_row[map[item].name] = moment(value, map[item].inputformat).format(map[item].outputformat);
					}
					else{
						parsed_row[map[item].name] = moment(value).format(map[item].outputformat);
					}
					break;
				case "float":
					var percision = 2;
					if(map[item].percision){
						percision = map[item].percision;
					}
					var symbol = "";
					if(map[item].symbol && format === "csv"){
						symbol = map[item].symbol;
					}
					parsed_row[map[item].name] = symbol + parseFloat(value.splice(map[item].width - percision, 0, ".")).toFixed(percision);
					break;
				case "int":
					parsed_row[map[item].name] = parseInt(value);
					break;
				case "bool":
					parsed_row[map[item].name] = false;
					if(value === map[item].tVal){
						parsed_row[map[item].name] = true;
					}
					break;
				case "string":
					parsed_row[map[item].name] = value;
					break;
				default:
					parsed_row[map[item].name] = value;
			}
		}
		else{
			parsed_row[map[item].name] = null;
		}
	}
	return parsed_row;
}

internals.parse = function(specs, input){
	try {
		if(typeof(specs) !== "object")  throw "specs is not an array";
		if(isEmpty(specs)) throw "specs is empty";
		if(isEmpty(specs.map)) throw "specs maps is empty";
		if(isEmpty(specs.options)) throw "specs options is empty";
		if(input === "") throw "input is empty";
		var array_output = [];
		var object_output = {};
		var split_input = input.replace(/\r\n/g,'\n').split("\n");
		if(split_input.indexOf("") !== -1){
			split_input.splice(split_input.indexOf(""), 1);
		}
		for(var i in split_input){
			if(split_input[i].length === specs.options.fullwidth && !specs.options.levels){
				if(specs.options.skiplines !== null){
					if(specs.options.skiplines.indexOf(parseInt(i) + 1) === -1){
						var row = returnCol(split_input[i], specs.map, specs.options.format);
						array_output.push(row)
					}
				}
				else{
					var row = returnCol(split_input[i], specs.map, specs.options.format);
					array_output.push(row)
				}
			}
			else if(specs.options.levels){
				var level = lodash.find(specs.options.levels, function(v, k){
					if(i >= v.start && i <= v.end){
						return true;
					}
				});
				var level_map = lodash.filter(specs.map, {
					level: lodash.findKey(specs.options.levels, function(v, k){
						if(i >= v.start && i <= v.end){
							return true;
						}
					})
				});
				if(split_input[i].length === level.fullwidth){
					if(!object_output.hasOwnProperty(level.nickname)){
						object_output[level.nickname] = [];
					}
					if(specs.options.skiplines !== null){
						if(specs.options.skiplines.indexOf(parseInt(i) + 1) === -1){
							var row = returnCol(split_input[i], level_map, specs.options.format);
							object_output[level.nickname].push(row);
						}
					}
					else{
						var row = returnCol(split_input[i], level_map, specs.options.format);
						object_output[level.nickname].push(row);
					}
				}
				else{
					throw "Row #" + (parseInt(i) + 1) + " does not match fullwidth";
				}
			}
			else{
				throw "Row #" + (parseInt(i) + 1) + " does not match fullwidth";
			}
		}
		switch(specs.options.format){
			case "csv":
				if(array_output.length === 0){
					throw "Multi-Level Maps Cannot Convert to CSV";
				}
				else{
					return Papa.unparse(array_output.length > 0 ? array_output : object_output, {
						newline: "\n"
					});	
				}
				break;
			default:
				return array_output.length > 0 ? array_output : object_output;
		}	
	}
	catch(err){
		console.log(err);
	}
};

internals.unparse = function(specs, input, levels){
	var output = [];
	try {
		if(typeof(specs) !== "object")  throw "specs is not an array";
		if(isEmpty(specs)) throw "specs is empty";
		if(input === "") throw "input is empty";
		var counter = 0;
		if(levels){
			var rowCount = 0;
			lodash.forEach(levels, function(l){
				var input_by_level = input[l];
				rowCount = rowCount + input_by_level.length;
			});
			lodash.forEach(levels, function(l){
				var input_by_level = input[l];
				var specs_by_level = lodash.filter(specs, {
					level: l
				});
				lodash.forEach(input_by_level, function(inp){
					lodash.forEach(specs_by_level, function(spec){
						var value = String(inp[spec.name]);
						var valueLength = value.length;
						if(spec.width - value.length > 0){
							for(var i = 1; i <= spec.width - valueLength; i++){
								var symbol = spec.padding_symbol ? spec.padding_symbol : " ";
								if(symbol.length > 1) throw "padding_symbol can not have length > 1";
								switch(spec.padding_position){
									case "start":
										value = symbol + value;
										break;
									case "end":
										value = value + symbol;
										break;
									default:
										value = symbol + value;
										break;
								}
							}
							output = output + value;
						}
					});
					counter = counter + 1;
					if(rowCount !== counter){
						output = output + "\n"
					}
				});

			});
			return output;
		}
		else{
			for(var row in input){
				for(var spec in specs){
					var value = String(input[row][specs[spec].name]);
					var valueLength = value.length;
					if(specs[spec].width - value.length > 0){
						for(var i = 1; i <= specs[spec].width - valueLength; i++){
							var symbol = specs[spec].padding_symbol ? specs[spec].padding_symbol : " ";
							if(symbol.length > 1) throw "padding_symbol can not have length > 1";
							switch(specs[spec].padding_position){
								case "start":
									value = symbol + value;
									break;
								case "end":
									value = value + symbol;
									break;
								default:
									value = symbol + value;
									break;
							}
						}
					}
					output = output + value;
				}
				counter = counter + 1;
				if(input.length !== counter){
					output = output + "\n"
				}
			}
			return output;
		}
	}
	catch(err){
		console.log(err);
	}
};

module.exports = internals;