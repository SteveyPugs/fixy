var fixy = require("../index");
var assert = require("assert");
describe("Fixy Tests", function() {
	describe("#parse()", function () {
		it("should return fixed-width-input as array(object)", function () {
			var test = fixy.parse({
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
					},{
						name: "DateEntered",
						width: 8,
						start: 6,
						type: "date",
						inputformat: "YYYYMMDD",
						outputformat: "YYYY-MM-DD"
					},{
						name: "IsBad",
						width: 1,
						start: 14,
						type: "bool",
						tVal: "Y",
						fVal: "N"
					},{
						name: "Rating",
						width: 3,
						start: 15,
						type: "float",
						percision: 2
					}],
				options:{
					fullwidth: 17,
					skiplines: null
				}
			}, "30SJP20121231N920");
			assert.deepEqual(test, [{
				Age: 30,
				Initial: "SJP",
				DateEntered: "2012-12-31",
				IsBad: false,
				Rating: 9.20
			}]);
		});
		it("should return fixed-width-input as array(object)", function () {
			var test = fixy.parse({
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
					},{
						name: "DateEntered",
						width: 8,
						start: 6,
						type: "date",
						inputformat: "YYYYMMDD",
						outputformat: "YYYY-MM-DD"
					},{
						name: "IsBad",
						width: 1,
						start: 14,
						type: "bool",
						tVal: "Y",
						fVal: "N"
					},{
						name: "Rating",
						width: 3,
						start: 15,
						type: "float",
						percision: 2
					}],
				options:{
					fullwidth: 17,
					skiplines: null
				}
			}, "30SJP20121231N900");
			assert.deepEqual(test, [{
				Age: 30,
				Initial: "SJP",
				DateEntered: "2012-12-31",
				IsBad: false,
				Rating: 9.00
			}]);
		});
		it("should return fixed-width-input as csv-string (no inner commas)", function () {
			var test = fixy.parse({
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
			}, "30SJP\n30SJP");
			assert.deepEqual(test, "Age,Initial\n30,SJP\n30,SJP");
		});
		it("should return fixed-width-input as csv-string (inner commas)", function () {
			var test = fixy.parse({
				map:[{
					name: "Age",
					width: 2,
					start: 1,
					type: "int"
				},{
					name: "Initial",
					width: 4,
					start: 3,
					type: "string"
				}],
				options:{
					fullwidth: 6,
					skiplines: null,
					format: "csv"
				}
			}, "30S,JP\n30S,JP");
			assert.deepEqual(test, "Age,Initial\n30,\"S,JP\"\n30,\"S,JP\"");
		});
		it("should return a fixed format when passed an array of data (with objects) padding front w/ spaces", function(){
			var test = fixy.unparse([{
					name: "Age",
					width: 7,
					padding_position: "start",
					padding_symbol: " "
				},{
					name: "Initial",
					width: 4,
					padding_position: "start",
					padding_symbol: " "
				}], [{
				Age: 30,
				Initial: "SJP"
			},{
				Age: 20,
				Initial: "CCS"
			}]);
			assert.deepEqual(test, "     30 SJP\n     20 CCS");
		});
		it("should return a fixed format when passed an array of data (with objects) padding behind w/ spaces", function(){
			var test = fixy.unparse([{
					name: "Age",
					width: 7,
					padding_position: "end",
					padding_symbol: " "
				},{
					name: "Initial",
					width: 4,
					padding_position: "end",
					padding_symbol: " "
				}], [{
				Age: 30,
				Initial: "SJP"
			},{
				Age: 20,
				Initial: "CCS"
			}]);
			assert.deepEqual(test, "30     SJP \n20     CCS ");
		});
		it("should return a fixed format when passed an array of data (with objects) padding front w/ # symbol", function(){
			var test = fixy.unparse([{
					name: "Age",
					width: 7,
					padding_position: "start",
					padding_symbol: "#"
				},{
					name: "Initial",
					width: 4,
					padding_position: "start",
					padding_symbol: "#"
				}], [{
				Age: 30,
				Initial: "SJP"
			},{
				Age: 20,
				Initial: "CCS"
			}]);
			assert.deepEqual(test, "#####30#SJP\n#####20#CCS");
		});
		it("should return a fixed format when passed an array of data (with objects) padding behind w/ # symbol", function(){
			var test = fixy.unparse([{
					name: "Age",
					width: 7,
					padding_position: "end",
					padding_symbol: "#"
				},{
					name: "Initial",
					width: 4,
					padding_position: "end",
					padding_symbol: "#"
				}], [{
				Age: 30,
				Initial: "SJP"
			},{
				Age: 20,
				Initial: "CCS"
			}]);
			assert.deepEqual(test, "30#####SJP#\n20#####CCS#");
		});
		it("should return a fixed format when passed an array of data (with objects) padding behind w/ different symbols", function(){
			var test = fixy.unparse([{
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
			assert.deepEqual(test, "30#####SJP@\n20#####CCS@");
		});
		it("should return a fixed format when passed an array of data (with objects) no padding setting or symbol setting", function(){
			var test = fixy.unparse([{
					name: "Age",
					width: 7
				},{
					name: "Initial",
					width: 4
				}], [{
				Age: 30,
				Initial: "SJP"
			},{
				Age: 20,
				Initial: "CCS"
			}]);
			assert.deepEqual(test, "     30 SJP\n     20 CCS");
		});
	});
});