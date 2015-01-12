var assert = require('assert'),
	util = require('../lib/util');

describe('util.isArray', function () {
	it('should work', function () {
		assert.equal(util.isArray([]), true);
		assert.equal(util.isArray(arguments), false);
	});
});

describe('util.isBoolean', function () {
	it('should work', function () {
		assert.equal(util.isBoolean(false), true);
		assert.equal(util.isBoolean(''), false);
		assert.equal(util.isBoolean(new Boolean(false)), false);
	});
});

describe('util.isBuffer', function () {
	it('should work', function () {
		assert.equal(util.isBuffer(new Buffer(0)), true);
	});
});

describe('util.isDate', function () {
	it('should work', function () {
		assert.equal(util.isDate(new Date()), true);
	});
});

describe('util.isError', function () {
	it('should work', function () {
		assert.equal(util.isError(new Error()), true);
		assert.equal(util.isError(new RangeError()), true);
	});
});

describe('util.isFunction', function () {
	it('should work', function () {
		assert.equal(util.isFunction(function () {}), true);
		assert.equal(util.isFunction(new Function()), true);
	});
});

describe('util.isNull', function () {
	it('should work', function () {
		assert.equal(util.isNull(null), true);
		assert.equal(util.isNull(undefined), false);
	});
});

describe('util.isNumber', function () {
	it('should work', function () {
		assert.equal(util.isNumber(0), true);
		assert.equal(util.isNumber('0'), false);
		assert.equal(util.isNumber(new Number(0)), false);
	});
});

describe('util.isObject', function () {
	it('should work', function () {
		assert.equal(util.isObject({}), true);
		assert.equal(util.isObject([]), true);
		assert.equal(util.isObject(function () {}), true);
	});
});

describe('util.isRegExp', function () {
	it('should work', function () {
		assert.equal(util.isRegExp(/^/), true);
		assert.equal(util.isRegExp(new RegExp()), true);
	});
});

describe('util.isString', function () {
	it('should work', function () {
		assert.equal(util.isString(''), true);
		assert.equal(util.isString(new String('')), false);
	});
});

describe('util.isUndefined', function () {
	it('should work', function () {
		assert.equal(util.isUndefined(undefined), true);
		assert.equal(util.isUndefined(null), false);
	});
});

describe('util.toArray', function () {
	it('should work', function () {
		assert.equal(util.isArray(util.toArray(arguments)), true);
	});
});

describe('util.type', function () {
	it('should work', function () {
		assert.equal(util.type(undefined), 'undefined');
		assert.equal(util.type(0), 'number');
		assert.equal(util.type(false), 'boolean');
		assert.equal(util.type(''), 'string');
		assert.equal(util.type(function () {}), 'function');
		assert.equal(util.type(/^/), 'regexp');
		assert.equal(util.type([]), 'array');
		assert.equal(util.type(new Date()), 'date');
		assert.equal(util.type(new Error()), 'error');
	});
});

describe('util.inherit', function () {
	it('should create a child constructor', function () {
		var Parent = function () {},
			Child = util.inherit(Parent, {});

		assert.equal(new Child() instanceof Parent, true);
	});

	it('should use the initializer', function () {
		var Child = util.inherit(Object, {
				_initialize: function (config) {
					this.config = config;
				}
			}),
			config = {};

		assert.equal(new Child(config).config, config);
	});

	it('should provide a superclass property', function () {
		var Child = util.inherit(Object, {});

		assert.equal(Child.superclass, Object.prototype);
	});

	it('should provide a extend method', function () {
		var Child = util.inherit(Object, {}),
			Grandson = Child.extend({});

		assert.equal(new Grandson() instanceof Child, true);
	});
});

describe('util.mix', function () {
	it('should mix two objects', function () {
		var foo = {
				x: 1
			},
			bar = {
				x: 2,
				y: 2
			};

		assert.equal(util.mix(foo, null, bar), foo,
			'skip null and returns the target');
		assert.equal(foo.x, 2, 'overrided');
		assert.equal(foo.y, 2, 'mixed');
	});

	it('should disable overriding', function () {
		var foo = {
				x: 1
			},
			bar = {
				x: 2,
				y: 2
			};

		assert.equal(util.mix(foo, bar, false), foo);
		assert.equal(foo.x, 1, 'not overrided');
		assert.equal(foo.y, 2);
	});
});

describe('util.merge', function () {
	it('should merge all objects into a new object', function () {
		var foo = {
				x: 1
			},
			bar = {
				x: 2,
				y: 2
			},
			obj = util.mix(foo, bar);

		assert.equal(obj.x, 2, 'overrided');
		assert.equal(obj.y, 2, 'merged');
	});

	it('should disable overriding', function () {
		var foo = {
				x: 1
			},
			bar = {
				x: 2,
				y: 2
			},
			obj = util.mix(foo, bar, false);

		assert.equal(obj.x, 1, 'not overrided');
		assert.equal(obj.y, 2);
	});
});

describe('util.each', function () {
	it('should work', function () {
		var obj = {
				x: 'x',
				y: 'y'
			};

		util.each(obj, function (value, key, o) {
			assert.equal(value, key);
			assert.equal(o, this);
		}, obj);
	});
});

describe('util.keys', function () {
	it('should work', function () {
		var obj = {
				x: 1,
				y: 2
			},
			keys = util.keys(obj);

		assert.equal(keys[0], 'x');
		assert.equal(keys[1], 'y');
	});
});

describe('util.value', function () {
	it('should work', function () {
		var obj = {
				x: 1,
				y: 2
			},
			values = util.values(obj);

		assert.equal(values[0], 1);
		assert.equal(values[1], 2);
	});
});

describe('util.encode', function () {
	it('should work', function () {
		var bin = util.encode('中文', 'gbk');

		assert.equal(util.isBuffer(bin), true);
		assert.equal(bin[0], 0xD6);
		assert.equal(bin[1], 0xD0);
		assert.equal(bin[2], 0xCE);
		assert.equal(bin[3], 0xC4);
	});
});

describe('util.decode', function () {
	it('should work', function () {
		var str = util.decode(new Buffer([ 0xD6, 0xD0, 0xCE, 0xC4 ]), 'gbk');

		assert.equal(util.isString(str), true);
		assert.equal(str, '中文');
	});
});

describe('util.mime', function () {
	it('should work', function () {
		assert.equal(util.mime('.js'), 'application/javascript');
		assert.equal(util.mime('foo/bar.css'), 'text/css');
	});
});