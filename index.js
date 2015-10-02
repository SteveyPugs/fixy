var internals = {};
var fs = require("fs");

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
		switch(map[item].type){
			case "d":
				parsed_row[map[item].name] = parseInt(row.substring(map[item].start-1, (map[item].start + map[item].width - 1)).trim());
				break;
			default:
				parsed_row[map[item].name] = row.substring(map[item].start-1, (map[item].start + map[item].width - 1)).trim();
		}
	}
	return parsed_row;
}

internals.parseFixedWidth = function(specs, file){
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
		for(var i in file){
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
		}
		return output;
	}
	catch(err){
		console.log(err);
	}
};

module.exports = internals;