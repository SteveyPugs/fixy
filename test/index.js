var fixy = require("../index");
var assert = require("assert");
describe("Fixy Tests", function(){
	describe("#parse()", function(){
		it("should return fixed-width-input as array(object)", function(){
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
		it("should return fixed-width-input as array(object)", function(){
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
		it("should return fixed-width-input as csv-string (no inner commas)", function(){
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
		it("should return fixed-width-input as csv-string (inner commas)", function(){
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
		it("should return fixed-width-input as csv-string (no inner commas) and adds a sybmol for float", function(){
			var test = fixy.parse({
				map:[{
					name: "Product",
					width: 10,
					start: 1,
					type: "string"
				},{
					name: "Price",
					width: 5,
					start: 11,
					type: "float",
					symbol: "$"
				}],
				options:{
					fullwidth: 15,
					skiplines: null,
					format: "csv"
				}
			}, "Apple     00099\nOrange    00079");
			assert.deepEqual(test, "Product,Price\nApple,$0.99\nOrange,$0.79");
		});
		it("should return fixed-width-input as array(object) and does not include the sybmol", function(){
			var test = fixy.parse({
				map:[{
					name: "Product",
					width: 10,
					start: 1,
					type: "string"
				},{
					name: "Price",
					width: 5,
					start: 11,
					type: "float",
					symbol: "$"
				}],
				options:{
					fullwidth: 15,
					skiplines: null
				}
			}, "Apple     00099\nOrange    00079");
			assert.deepEqual(test, [{
				Product: "Apple",
				Price: 0.99
			},{
				Product: "Orange",
				Price: 0.79
			}]);
		});
		it("should return fixed-width-input (multi-leveled) as array(object)", function(){
			var test = fixy.parse({
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
				},{
					name: "Initial",
					width: 3,
					start: 3,
					type: "string",
					level: "B"
				},{
					name: "DateEntered",
					width: 8,
					start: 6,
					type: "date",
					inputformat: "YYYYMMDD",
					outputformat: "YYYY-MM-DD",
					level: "B"
				},{
					name: "IsBad",
					width: 1,
					start: 14,
					type: "bool",
					tVal: "Y",
					fVal: "N",
					level: "B"
				},{
					name: "Rating",
					width: 3,
					start: 15,
					type: "float",
					percision: 2,
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
							fullwidth: 17
						}
					}
				}
			}, "Steve  \n30SJP20121231N920");
			assert.deepEqual(test, {
				A: [{ Name: "Steve" }],
				B: [{
					Age: 30,
					Initial: "SJP",
					DateEntered: "2012-12-31",
					IsBad: false,
					Rating: 9.20
				}]
			});
		});
		it("should return fixed-width-input as array(object) if decimal within float", function(){
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
						width: 4,
						start: 15,
						type: "float",
						percision: 2
					}],
				options:{
					fullwidth: 18,
					skiplines: null
				}
			}, "30SJP20121231N9.20");
			assert.deepEqual(test, [{
				Age: 30,
				Initial: "SJP",
				DateEntered: "2012-12-31",
				IsBad: false,
				Rating: 9.20
			}]);
		});
		it("should return fixed-width-input (multi-leveled) as array(object) if decimal within float", function(){
			var test = fixy.parse({
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
				},{
					name: "Initial",
					width: 3,
					start: 3,
					type: "string",
					level: "B"
				},{
					name: "DateEntered",
					width: 8,
					start: 6,
					type: "date",
					inputformat: "YYYYMMDD",
					outputformat: "YYYY-MM-DD",
					level: "B"
				},{
					name: "IsBad",
					width: 1,
					start: 14,
					type: "bool",
					tVal: "Y",
					fVal: "N",
					level: "B"
				},{
					name: "Rating",
					width: 4,
					start: 15,
					type: "float",
					percision: 2,
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
							fullwidth: 18
						}
					}
				}
			}, "Steve  \n30SJP20121231N9.20");
			assert.deepEqual(test, {
				A: [{ Name: "Steve" }],
				B: [{
					Age: 30,
					Initial: "SJP",
					DateEntered: "2012-12-31",
					IsBad: false,
					Rating: 9.20
				}]
			});
		});
	});
	describe("#unparse()", function(){
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
		it("should return a fixed format when passed an object", function(){
			var test = fixy.unparse([{
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
				A: [{ Name: "Steve" }],
				B: [{
					Age: 30,
					Initial: "SJP"
				},{
					Age: 20,
					Initial: "CCS"
				}]
			}, ["A", "B"]);
			assert.deepEqual(test, "Steve  \n30 SJP \n20 CCS ");
		});
		it("should allow default values", function(){
			var test = fixy.unparse([{
					name: "Age",
					width: 7,
					default: 20
			},{
				name: "Initial",
				width: 4
			}], [{
				Initial: "SJP"
			}]);
			assert.deepEqual(test, "     20 SJP");
		});
		it("should handle null values", function(){
			var test = fixy.unparse([{
					name: "Age",
				width: 7
			},{
				name: "Initial",
				width: 4,
				padding_symbol: "#"
			}], [{
				Age: undefined,
				Initial: null
			}]);
			assert.deepEqual(test, "       ####");
		});
		it("should truncate values that are too long", function(){
			var test = fixy.unparse([{
				name: "Name",
				width: 7
			}], [{
				Name: "Alexander"
			}]);
			assert.deepEqual(test, "Alexand");
		});
	});
});
