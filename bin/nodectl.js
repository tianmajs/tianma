'use strict';

var cp = require('child_process'),
	fs = require('fs'),
	path = require('path'),
	util = require('util');

var PATH_NODE = process.argv[0],

	PATH_GLOBAL = path.join(process.env['HOME']
			|| process.env['USERPROFILE']
			|| '.',
		'.tianma'),

	PATH_BOOTSTRAP = path.join(__dirname, 'bootstrap.js');

/**
 * Find a file.
 * @param filename {string}
 * @return {string|null}
 */
function find(filename, cwd) {
	var pathname;

	// Find in cwd first.
	pathname = path.resolve(filename);
	if (fs.existsSync(pathname)) {
		return pathname;
	}

	// Then find global.
	pathname = path.resolve(PATH_GLOBAL, filename);
	if (fs.existsSync(pathname)) {
		return pathname;
	}

	// Not found.
	return null;
}

/**
 * Generate a NODE_PATH where tianma could be found.
 * @return {string}
 */
function generateNodePath() {
	var nodePath = process.env['NODE_PATH'],
		pathname = path.join(__dirname, '../bridge/'),
		separator = process.platform === 'win32' ?
			';' : ':';

	nodePath = nodePath ? nodePath.split(separator) : [];

	if (nodePath.indexOf(pathname) === -1) {
		nodePath = nodePath.concat(pathname);
	}

	return nodePath.join(separator);
}

/**
 * Check whether a node process is running.
 * @param callback {Function}
 */
function isRunning(callback) {
	var tag = find('.running'),
		parts, pid, config;
		
	if (tag) {
		parts = fs.readFileSync(tag, 'utf-8').split('\n');
		pid = parts[1];
		config = parts[0];
	}

	if (pid) {
		var image = path.basename(PATH_NODE),
			cmd = util.format(process.platform === 'win32' ?
				'tasklist /fi "PID eq %s" | findstr /i "%s"' :
				'ps -f -p %s | grep "%s"', pid, image);

		cp.exec(cmd, function (err, stdout, stderr) {
			if (err || stdout.toString().trim() === '') {
				callback(null);
			} else {
				callback(pid, config, tag);
			}
		});
	} else {
		callback(null);
	}
}

/**
 * Restart current background service.
 */
var	restart = exports.restart = function () {
	stop(function (config) {
		setTimeout(function () {
			start(config);
		}, 1000);
	});
};


/**
 * Start a front service.
 * @param [config] {string}
 */
var	run = exports.run = function (config) {
	config = find(config);
	
	if (!config) {
		return console.log('Config "%s" not found', config);
	} else {
		process.env['TIANMA_PATH'] = path.dirname(config);
	}

	var args = [ '--harmony', PATH_BOOTSTRAP, config ];

	process.env['NODE_PATH'] = generateNodePath();
	
	console.log('Using "%s"', config);
	console.log('Press [Ctrl+C] to stop service..');

	cp.spawn(PATH_NODE, args, {
		stdio: [ 0, 1, 2 ]
	});
};

/**
 * Start a background service.
 * @param [config] {string}
 */
var	start = exports.start = function (config) {
	config = find(config);
	
	if (!config) {
		return console.log('Config "%s" not found', config);
	} else {
		process.env['TIANMA_PATH'] = path.dirname(config);
	}
	
	isRunning(function (pid) {
		if (pid) {
			return console.log('Service is running!');
		}
		
		var args = [ '--harmony', PATH_BOOTSTRAP, config ],
			log = path.join(config, '../tianma.log'),
			tag = path.join(config, '../.running'),
			child;
			
		process.env['NODE_PATH'] = generateNodePath();
		
		console.log('Using "%s"', config);
		
		child = cp.spawn(PATH_NODE, args, {
			detached: true,
			stdio: [ 'ignore', 'ignore', fs.openSync(log, 'w+') ]
		});
		
		child.on('exit', function (code) {
			clearTimeout(handle);
			
			if (code !== 0) {
				process.stdout.write('\b');
				console.log('Service CANNOT start!\n');
				console.log(fs.readFileSync(log, 'utf8'));
			}
		});
		
		var count = [ '/', '|', '\\', '-',
					  '/', '|', '\\', '-',
					  '/', '|', '\\', '-' ],
			handle;
		
		(function next() {
			handle = setTimeout(function () {
				if (count.length !== 0) {
					process.stdout.write('\b' + count.pop());
					next();
				} else {
					fs.writeFileSync(tag, config + '\n' + child.pid);
					child.unref();
					process.stdout.write('\b');
					console.log('Service started.');
				}
			}, 250);
		}());
	});
};

/**
 * Stop current background service.
 * @param [callback] {Function}
 */
var	stop = exports.stop = function (callback) {
	isRunning(function (pid, config, tag) {
		var err;
	
		if (pid) {
			try {
				process.kill(pid);
				fs.unlinkSync(tag);
				console.log('Service killed.');
			} catch (e) {
				err = e;
			}
			
			if (err) {
				if (err.code === 'EPERM') {
					console.log('No permission to kill service!');
				} else {
					console.log('%s!', err.message);
				}
			} else {
				callback && callback(config);
			}
		} else {
			console.log('No running service!');
		}
	});
};
