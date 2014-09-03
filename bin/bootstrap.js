'use strict';

var fs = require('fs'),
	path = require('path'),
	util = require('mini-util');

var	PATH_SOURCE = path.join(__dirname, '../deploy'),

	PATH_GLOBAL = path.join(process.env['HOME']
			|| process.env['USERPROFILE']
			|| '.',
		'.tianma');

var MESSAGE = {
	'EADDRINUSE': 'Error: Port %s is used by another program',
	'EACCES': 'Error: No permission to use port %s',
	'ENPM': 'Error: Cannot install package "%s"',
	'EPLAY': 'Error: Remote config "%s" is not available'
};

/**
 * Copy a directory.
 * @param source {string}
 * @param target {string}
 */
function cp(source, target) {
	fs.readdirSync(source).forEach(function (filename) {
		var s = path.join(source, filename),
			t = path.join(target, filename);

		if (fs.statSync(s).isDirectory()) {
			fs.mkdirSync(t);
			cp(s, t);
		} else {
			fs.writeFileSync(t, fs.readFileSync(s));
		}
	});
}

/**
 * If global config directory not exists, then create a default one.
 */
function checkGlobalDir() {
	if (!fs.existsSync(PATH_GLOBAL)) {
		fs.mkdirSync(PATH_GLOBAL);
		cp(PATH_SOURCE, PATH_GLOBAL);
	}
}

/**
 * Add a time stamp prefix to the output message.
 */
function pretty() {
	var info = console.log,
		warn = console.error;
	
	// Hack the native log method.
	console.log = function () {
		info('[%s] %s',
			new Date().toLocaleTimeString(),
			util.format.apply(null, arguments));
	};
	
	// Hack the native error method.
	console.error = function () {
		warn('[%s] %s',
			new Date().toLocaleTimeString(),
			util.format.apply(null, arguments));
	};
}

/**
 * Prepare the environment before run main program.
 * @param callback {Function}
 */
function bootstrap(callback) {
	// Make new created files writable by group members.
	if (process.setgid && process.getgid) {
		process.umask('002');
		process.setgid(parseInt(
			process.env['SUDO_GID'] || process.getgid(), 10));
	}
	
	pretty();
	checkGlobalDir();
	callback();
}

/**
 * Print global error message in an elegant way.
 */
process.on('uncaughtException', function (err) {
	var parts = (err.stack || String(err)).split('\n'),
		message = parts.shift(),
		stack = parts.join('\n'),
		tpl;
		
	if (tpl = MESSAGE[err.code]) {
		tpl = [ tpl ].concat(err.vars || []);
		message = util.format.apply(null, tpl);
	}

	console.error('%s\n%s', message, stack);
	console.error('Service down :(');
	
	process.exit(1);
});

if (module.parent) { // Use as a sub module.
	module.exports = bootstrap;
} else { // Use as a main module.
	bootstrap(function () {
		require(path.resolve(process.argv[2]));
	});
}
