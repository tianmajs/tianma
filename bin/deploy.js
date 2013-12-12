var fs = require('fs'),
	path = require('path');

var SOURCE_FOLDER = path.join(__dirname, '../deploy'),

	/**
	 * Copy a directory.
	 * @param source {string}
	 * @param target {string}
	 */
	cp = function (source, target) {
		fs.readdirSync(source).forEach(function (filename) {
			var s = path.join(source, filename),
				t = path.join(target, filename);

			console.log('create : %s', t);

			if (fs.statSync(s).isDirectory()) {
				fs.mkdirSync(t);
				cp(s, t);
			} else {
				fs.writeFileSync(t, fs.readFileSync(s));
			}
		});
	},

	/**
	 * Deploy a website directory.
	 * @param dir {string}
	 */
	deploy = function (dir) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		if (fs.readdirSync(dir).length === 0) {
			cp(SOURCE_FOLDER, dir);
			console.log('\n..done');
		} else {
			console.log('[!] "%s" is not empty.', dir);
		}
	};

module.exports = deploy;
