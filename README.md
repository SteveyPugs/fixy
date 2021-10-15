[![npm version](https://badge.fury.io/js/fixy.svg)](https://badge.fury.io/js/fixy)
[![Dependency Status](https://david-dm.org/SteveyPugs/fixy.svg)](https://david-dm.org/SteveyPugs/fixy)
[![devDependency Status](https://david-dm.org/SteveyPugs/fixy/dev-status.svg)](https://david-dm.org/SteveyPugs/fixy#info=devDependencies)
[![Build Status](https://travis-ci.org/SteveyPugs/fixy.svg?branch=master)](https://travis-ci.org/SteveyPugs/fixy)

# Fixy

Fixy is an npm module for parsing fixed formatted strings/files and unparsing an Array of Objects.

#### Install

	npm install fixy --save

#### Usage
##### fixy.parse | Single Level

	var fixy = fixy.parse({
		map:[{
			name: "Age",
			width: 2,
			start: 1,
			type: "int"
		},{
			name: "Initial",
			width: 3,
			start: 3,
			type: "string"
		}],
		options:{
			fullwidth: 5,
			skiplines: null,
			format: "csv"
		}
	}, "21ABC\n22DEF");

##### fixy.parse | Multi Level

	var fixy = fixy.parse({
		map:[{
			name: "Name",
			width: 7,
			start: 1,
			type: "string",
			level: "A"
		},{
			name: "Age",
			width: 2,
			start: 1,
			type: "int",
			level: "B"
		}],
		options:{
			skiplines: null,
			levels: {
				"A": {
					nickname: "A",
					start: 0,
					end: 0,
					fullwidth: 7
				},
				"B": {
					nickname: "B",
					start: 1,
					end: 2,
					fullwidth: 2
				}
			}
		}
	}, "Steve  \n30");

##### fixy.unparse | Single Level

	var fixy = fixy.unparse([{
		name: "Age",
		width: 7,
		padding_position: "end",
		padding_symbol: "#"
	},{
		name: "Initial",
		width: 4,
		padding_position: "end",
		padding_symbol: "@"
	}], [{
		Age: 30,
		Initial: "SJP"
	},{
		Age: 20,
		Initial: "CCS"
	}]);

##### fixy.unparse | with preprocessing

	let noDecimal = (value, row) => {
		return `${value}`.replace(/\./, '');
	}

	var fixy = fixy.unparse([{
		name: "Name",
		width: 10,
		padding_position: "start",
		padding_symbol: " "
	},{
		name: "Balance",
		width: 10,
		padding_position: "start",
		padding_symbol: "0",
		preprocess: noDecimal
	}], [{
		Name: "Jenny",
		Balance: 86753.09
	}]);

##### fixy.unparse | with preprocessing using other row data

	const useOther = (value, row) => {
		return `${value} ${row.Currency}`;
	}

	var fixy = fixy.unparse([{
		name: "Name",
		width: 10,
		padding_position: "start",
		padding_symbol: " "
	},{
		name: "Balance",
		width: 10,
		padding_position: "start",
		padding_symbol: "0",
		preprocess: useOther
	}], [{
		Name: "Jenny",
		Balance: 86753.09,
		Currency: 'CAD'
	}]);

##### fixy.unparse | Multi Level

	var fixy = fixy.unparse([{
		name: "Name",
		width: 7,
		padding_position: "end",
		level: "A",
	},{
		name: "Age",
		width: 3,
		padding_position: "end",
		level: "B"
	},{
		name: "Initial",
		width: 4,
		padding_position: "end",
		level: "B"
	}], {
		A: [{ Name: "Mike" }],
		B: [{
			Age: 30,
			Initial: "MAS"
		},{
			Age: 20,
			Initial: "SAM"
		}]
	}, ["A", "B"]);


#### Configuration

##### fixy.parse({map, options}, fixed-format-string)

###### map

A map [array of objects] of the column names, width, starting point, type of value, extra type settings.


- Integer
	- type : "int"
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
	- level (Required if Multi Level) | Level Map Name
- Float
	- type : "float" (decimal use allowed but not required)
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
	- precision (Optional) | Float Precision Value (Ex: 9.20 is 2) | DEFAULT TO 2 DECIMAL PLACES
	- symbol (Optional) | Symbol Value (Ex: $9.20) | ONLY AVAILABLE FOR FORMAT = CSV
	- level (Required if Multi Level) | Level Map Name
- Date
	- type : "date"
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
	- inputformat (Required) | Format Date Date is Currently In
	- outputformat (Required) | Format Date Date is Returned As
	- level (Required if Multi Level) | Level Map Name
- String
	- type : "string"
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
	- level (Required if Multi Level) | Level Map Name
- Boolean
	- type : "bool"
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
	- tVal (Required) | String Value of True
	- fVal (Required) | String Value of False
	- level (Required if Multi Level) | Level Map Name

###### options (for single level)

- fullwidth = full length of rows from start to end
- skiplines = optional array of rows to be skipped. May be left null
- format = defaults "json". Valid selections are: json, csv

###### options (for multi level)

- skiplines = optional array of rows to be skipped. May be left null
- levels = level map object (see example)


	"LEVELNAME": {
		nickname: "NameInMap",
		start: 0, //row start, zero based
		end: 0, //row end, zero based
		fullwidth: 7 // row width per level
	}


##### fixy.unparse(map, array of objects || object with levels [see example], [array level order (required for multi)])

###### map

A map [array of objects] of the column names, width, starting point, type of value, extra type settings.

- name (Required) | Name of the Key
- width (Required) | Length of Fixed Section
- padding_position (Optional. Default: "start") | Where padding should start ("start" or "end")
- padding_symbol (Optional. Default: space " ") | What empty space should be padded with (any symbol, letter or number)
- preprocess (Optional. Default: null) | What preprocessing should be enacted on respective values prior to padding.
- level (Required if Multi Level) | Level Map Name

###### example object with level mapping

	{
		A: [{ Name: "Mike" }],
		B: [{
			Age: 30,
			Initial: "MSP"
		}]
	}
