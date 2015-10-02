var fixy = require("../index");
var assert = require("assert");
describe('Fixy Tests', function() {
	describe('#parseFixedWidth()', function () {
		it('should return correctly parse fixed width file', function () {
			var test = fixy.parseFixedWidth({
				map:[{
						name: "Age",
						width: 2,
						start: 1,
						type: "d"
					},{
						name: "Initial",
						width: 3,
						start: 3,
						type: "s"
					},{
						name: "Sex",
						width: 1,
						start: 6,
						type: "s"
					}],
				options:{
					fullwidth: 6,
					skiplines: null
				}
			}, "30SJPM");
			assert.deepEqual(test, [{
				Age: 30,
				Initial: 'SJP',
				Sex: 'M'
			}]);
		});
	});
});