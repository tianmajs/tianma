var path = require('path');

	/**
	 * Prepare the environment before run main program.
	 * @param callback {Function}
	 */
var bootstrap = function (callback) {
		// Make new created files writable by group members.
		if (process.setgid && process.getgid) {
			process.umask('002');
			process.setgid(parseInt(
				process.env['SUDO_GID'] || process.getgid(), 10));
		}

		callback();
	};

if (module.parent) { // Use as a sub module.
	module.exports = bootstrap;
} else { // Use as a main module.
	bootstrap(function () {
		require(path.resolve(process.argv[2]));
	});
}
