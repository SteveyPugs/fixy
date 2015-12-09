[![npm version](https://badge.fury.io/js/fixy.svg)](https://badge.fury.io/js/fixy)
[![Dependency Status](https://david-dm.org/SteveyPugs/fixy.svg)](https://david-dm.org/SteveyPugs/fixy)
[![devDependency Status](https://david-dm.org/SteveyPugs/fixy/dev-status.svg)](https://david-dm.org/SteveyPugs/fixy#info=devDependencies)
[![Build Status](https://travis-ci.org/SteveyPugs/fixy.svg?branch=master)](https://travis-ci.org/SteveyPugs/fixy)

# Fixy
   
Fixy is an npm module for parsing fixed formatted strings/files.

#### Install

	npm install fixy --save

#### Usage

	var fixy = fixy.parse({
		map: [{
			name: "Age",
			width: 2,
			start: 1,
			type: "int"
		}],
		options: {
			fullwidth: 2,
			skiplines: null
		}
	},"30ABC20151201Y950");

#### Configuration

###### map

A map [array of objects] of the column names, width, starting point, type of value, extra type settings.

- Integer
	- type : "int"
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
- Float
	- type : "float"
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
	- percision (Required) | Float Percision Value (Ex: 9.20 is 2)
- Date
	- type : "date"
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
	- inputformat (Required) | Format Date Date is Currently In
	- outputformat (Required) | Format Date Date is Returned As
- String
	- type : "string"
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
- Boolean
	- type : "bool"
	- name (Required) | Name of the Column
	- width (Required) | Length of Column
	- start (Required) | Start of Column in Row
	- tVal (Required) | String Value of True
	- fVal (Required) | String Value of False

###### options
	
- fullwidth = full length / width of row from start to end
- skiplines = optional array of rows to be skipped. May be left null

