var internals = {};
var fs = require("fs");
var moment = require("moment");
var Papa = require("papaparse");
var lodash = require("lodash");

String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

var parseCol = function(row, map, format){
	var r = {};
	lodash.forEach(map, function(i){
		var v = row.substring(i.start-1, (i.start + i.width - 1)).trim();
		if(v){
			switch(i.type){
				case "date":
					if(i.inputformat){
						if(moment(v, i.inputformat).isValid()){
							r[i.name] = moment(v, i.inputformat).format(i.outputformat);	
						}
						else{
							r[i.name] = null;
						}
					}
					else{
						if(moment(v).isValid()){
							r[i.name] = moment(v).format(i.outputformat);
						}
						else{
							r[i.name] = null;
						}
					}
					break;
				case "float":
					var percision = 2;
					if(i.percision){
						percision = i.percision;
					}
					var symbol = "";
					if(i.symbol && format === "csv"){
						symbol = i.symbol;
					}
					r[i.name] = symbol + parseFloat(v.splice(i.width - percision, 0, ".")).toFixed(percision);
					break;
				case "int":
					r[i.name] = parseInt(v);
					break;
				case "bool":
					r[i.name] = false;
					if(v === i.tVal){
						r[i.name] = true;
					}
					break;
				case "string":
					r[i.name] = v;
					break;
				default:
					r[i.name] = v;
			}
		}
		else{
			r[i.name] = null;
		}
	});
	return r;
};

internals.parse = function(specs, input){
	try {
		if(typeof(specs) !== "object")  throw "specs is not an array";
		if(lodash.isEmpty(specs)) throw "specs is empty";
		if(lodash.isEmpty(specs.map)) throw "specs maps is empty";
		if(lodash.isEmpty(specs.options)) throw "specs options is empty";
		if(input === "") throw "input is empty";
		var array_output = [];
		var object_output = {};
		var split_input = input.replace(/\r\n/g,'\n').split("\n");
		if(split_input.indexOf("") !== -1){
			split_input.splice(split_input.indexOf(""), 1);
		}
		lodash.forEach(split_input, function(i, idx){
			if(i.length === specs.options.fullwidth && !specs.options.levels){
				if(specs.options.skiplines !== null){
					if(specs.options.skiplines.indexOf(parseInt(idx) + 1) === -1){
						array_output.push(parseCol(i, specs.map, specs.options.format));
					}
				}
				else{
					array_output.push(parseCol(i, specs.map, specs.options.format));
				}
			}
			else if(specs.options.levels){
				var level = lodash.find(specs.options.levels, function(v, k){
					if(idx >= v.start && idx <= v.end){
						return true;
					}
				});
				var level_map = lodash.filter(specs.map, {
					level: lodash.findKey(specs.options.levels, function(v, k){
						if(idx >= v.start && idx <= v.end){
							return true;
						}
					})
				});
				if(i.length === level.fullwidth){
					if(!object_output.hasOwnProperty(level.nickname)){
						object_output[level.nickname] = [];
					}
					if(specs.options.skiplines !== null){
						if(specs.options.skiplines.indexOf(parseInt(idx) + 1) === -1){
							object_output[level.nickname].push(parseCol(i, level_map, specs.options.format));
						}
					}
					else{
						object_output[level.nickname].push(parseCol(i, level_map, specs.options.format));
					}
				}
				else{
					throw "Row #" + (parseInt(idx) + 1) + " does not match fullwidth";
				}
			}
			else{
				throw "Row #" + (parseInt(idx) + 1) + " does not match fullwidth";
			}
		});
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
		if(lodash.isEmpty(specs)) throw "specs is empty";
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
						if(valueLength > spec.width){
							value = value.substr(0, spec.width);
						}
						else if(spec.width - value.length > 0){
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
						}
						output = output + value;
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
					if(valueLength > specs[spec].width){
						value = value.substr(0, specs[spec].width);
					}
					else if(specs[spec].width - value.length > 0){
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