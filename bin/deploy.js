/**
 * Tianma - Bin - Deploy
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var fs = require('fs'),
	path = require('path'),
	tianma = require('tianma'),
	util = require('pegasus').util;

var SOURCE_FOLDER = path.join(__dirname, '../deploy'),

	/**
	 * Copy file synchronously.
	 * @param src {string}
	 * @param dst {string}
	 */
	copySync = function (src, dst) {
		fs.writeFileSync(dst, fs.readFileSync(src));
	},

	/**
	 * Copy all contents of src folder to dst folder.
	 * @param dir {string}
	 * @param silent {boolean}
	 * @param log {boolean}
	 */
	deploy = function (dir, silent, log) {
		// Create files with real uid & gid.
		if (process.setuid && process.getuid) {
			process.setuid(process.getuid());
		}
		if (process.setgid && process.getgid) {
			process.setgid(process.getgid());
		}

		if (isEmpty(dir)) { // Deploy to empty directory only.
			travel(SOURCE_FOLDER, function (src, relative, isDir) {
				var dst = path.join(dir, relative);

				if (isDir) {
					fs.mkdirSync(dst);
				} else {
					copySync(src, dst);
				}

				console.log('create : %s', dst);
			}, null);

			setup(dir, silent, log);

			console.log('\n..done');
		} else {
			console.log('"%s" is not empty.', dir);
		}
	},

	/**
	 * Check deploy directory.
	 * @param dir {string}
	 * @return {boolean}
	 */
	isEmpty = function (dir) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
			console.log('create : %s', dir);
		}

		return fs.readdirSync(dir).length === 0;
	},

	/**
	 * Setup config.js and loader.
	 * @param dir {string}
	 * @param silent {boolean}
	 * @param log {boolean}
	 */
	setup = function (dir, silent, log) {
		var filename,
			content;

		filename = path.join(dir, 'config.js');
		fs.writeFileSync(
			filename,
			util.tmpl(fs.readFileSync(filename, 'utf-8'), {
				log: '' + log,
				silent: '' + silent,
				version: tianma.version
			}),
			'utf-8'
		);
		console.log('update : %s', filename);

		if (process.platform !== 'win32') {
			filename = path.join(dir, 'startws');
			fs.chmodSync(filename, '755');
			console.log('update : %s', filename);

			filename = path.join(dir, 'killws');
			fs.chmodSync(filename, '755');
			console.log('update : %s', filename);
		}
	},

	/**
	 * Travel directory.
	 * @param dir {string}
	 * @param lfn {Function|null}
	 * @param rfn {Function|null}
	 * @param [root] {string}
	 */
	travel = function (dir, lfn, rfn, root) {
		root = root || dir;

		fs.readdirSync(dir).forEach(function (file) {
			var pathname = path.join(dir, file),
				relative = path.relative(root, pathname),
				isDir = fs.statSync(pathname).isDirectory();

			lfn && lfn(pathname, relative, isDir);

			if (isDir) {
				travel(pathname, lfn, rfn, root);
			}

			rfn && rfn(pathname, relative, isDir);
		});
	};

module.exports = deploy;
