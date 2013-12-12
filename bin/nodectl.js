var cp = require('child_process'),
	fs = require('fs'),
	path = require('path'),
	util = require('util');

var PATH_BOOTSTRAP = path.join(__dirname, 'bootstrap.js'),

	/**
	 * Generate NODE_PATH for tianma & pegasus.
	 * @return {string}
	 */
	generateNodePath = exports.generateNodePath = function () {
		var nodePath = process.env['NODE_PATH'],
			pathname = path.join(__dirname, '../bridge/'),
			separator = process.platform === 'win32' ?
				';' : ':';

		nodePath = nodePath ? nodePath.split(separator) : [];

		if (nodePath.indexOf(pathname) === -1) {
			nodePath = nodePath.concat(pathname);
		}

		return nodePath.join(separator);
	},

	/**
	 * Check whether a node process is running.
	 * @param pid {string}
	 * @param callback {Function}
	 */
	isRunning = function (pid, callback) {
		if (pid) {
			var cmd = util.format(process.platform === 'win32' ?
					'tasklist /fi "PID eq %s" | findstr /i "node.exe"' :
					'ps -f -p %s | grep "node"', pid);

			cp.exec(cmd, function (err, stdout, stderr) {
				if (err) {
					callback(false);
				} else {
					callback(stdout.toString().trim() !== '');
				}
			});
		} else {
			callback(false);
		}
	},

	/**
	 * Restart current background service.
	 * @param config {string}
	 */
	restart = exports.restart = function (config) {
		stop(function (last) {
			setTimeout(function () {
				start(last || config);
			}, 1000);
		});
	},

	/**
	 * Start a front service.
	 * @param [config] {string}
	 */
	run = exports.run = function (config) {
		var fallback = false;

		process.env['NODE_PATH'] = generateNodePath();

		try {
			module.constructor._initPaths();
		} catch (err) {
			fallback = true;
		}

		console.log('[i] Press [Ctrl+C] to stop service..');

		if (fallback) {
			cp.spawn('node', [ PATH_BOOTSTRAP, config ], {
				stdio: [ 0, 1, 2 ]
			});
		} else {
			require(path.resolve(config));
		}
	},

	/**
	 * Start a background service.
	 * @param [config] {string}
	 * @param [callback] {Function}
	 */
	start = exports.start = function (config, callback) {
		var now = new Date(),
			log = util.format('log/%s-%s-%s.log',
				now.getFullYear(), now.getMonth() + 1, now.getDate()),
			pid = fs.existsSync('.running')
				&& fs.readFileSync('.running', 'utf-8').split('\n')[1],
			child;

		isRunning(pid, function (running) {
			if (running) {
				console.log('[!] Service is running.');
			} else {
				if (!fs.existsSync('log')) {
					fs.mkdirSync('log');
				}

				process.env['NODE_PATH'] = generateNodePath();

				child = cp.spawn('node', [ PATH_BOOTSTRAP, config ], {
					detached: true,
					stdio: [ 'ignore', 'ignore', fs.openSync(log, 'a+') ]
				});

				fs.writeFileSync('.running', config + '\n' + child.pid);

				child.unref();

				console.log('[i] Service started.');
			}

			callback && callback(config);
		});
	},

	/**
	 * Stop current background service.
	 * @param [callback] {Function}
	 */
	stop = exports.stop = function (callback) {
		var data, config, pid;

		if (fs.existsSync('.running')) {
			data = fs.readFileSync('.running', 'utf-8').split('\n');
			config = data[0];
			pid = data[1];
		}

		isRunning(pid, function (running) {
			if (running) {
				try {
					process.kill(pid);
					fs.unlinkSync('.running');
					console.log('[i] Service killed.');
				} catch (err) {
					if (err.code === 'EPERM') {
						console.log(
							'[!] Cannot kill service owned by root.\n' +
							'    Try to run command with `sudo`.'
						);
					} else {
						console.log('[!] %s', err.message);
					}
				}
			} else {
				console.log('[!] No running service.');
			}

			callback && callback(config);
		});
	};
