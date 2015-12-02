var internals = {};
var fs = require("fs");
var moment = require("moment");

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

function returnCol(row, map){	
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
					parsed_row[map[item].name] = parseFloat(value.splice(map[item].width - percision, 0, "."));
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

internals.parse = function(specs, file){
	var output = [];
	try {
		if(typeof(specs) !== "object")  throw "specs is not an array";
		if(isEmpty(specs)) throw "specs is empty";
		if(isEmpty(specs.map)) throw "specs maps is empty";
		if(isEmpty(specs.options)) throw "specs options is empty";
		if(file === "") throw "file is empty";
		var file = file.replace(/\r\n/g,'\n').split("\n")
		if(file.indexOf("") !== -1){
			file.splice(file.indexOf(""), 1);
		}
		var count = 1;
		for(var i in file){
			count = count + parseInt(i);
			if(file[i].length === specs.options.fullwidth){
				if(specs.options.skiplines !== null){
					if(specs.options.skiplines.indexOf(parseInt(i) + 1) === -1){
						var row = returnCol(file[i], specs.map);
						output.push(row)
					}
				}
				else{
					var row = returnCol(file[i], specs.map);
					output.push(row)
				}
			}
			else{
				throw "row " + count + " is incorrect length";
			}
		}
		return output;
	}
	catch(err){
		console.log(err);
	}
};

module.exports = internals;