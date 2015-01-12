var assert = require('assert'),
	version = require('../lib/version'),
	pkg = require('../package.json');

describe('version', function () {
	it('should be consistent with package.json', function () {
		assert.equal(version.number, pkg.version);
		assert.equal(
			version.major + '.' +
			version.minor + '.' +
			version.patch, pkg.version);
	});
});
