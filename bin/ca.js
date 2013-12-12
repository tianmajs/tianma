var cp = require('child_process'),
	crypto = require('crypto'),
	fs = require('fs'),
	path = require('path');

var ROOT_CER = path.join(__dirname, '../deploy/certificates/tianma.cer'),

	ROOT_KEY = path.join(__dirname, '../deploy/certificates/tianma.key'),

	/**
	 * Run batch task.
	 * @param exec {Function}
	 * @param args {Array}
	 * @param callback {Function}
	 */
	batch = function (exec, args, callback) {
		(function next(i) {
			if (i < args.length) {
				exec(args[i], function (err, stdout, stderr) {
					if (err) {
						callback(err);
					} else {
						next(i + 1);
					}
				});
			} else {
				callback(null);
			}
		}(0));
	},

	/**
	 * Generate ssl certificates for hostname.
	 * @param hostname {string}
	 * @param dir {string}
	 */
	ca = function (hostname, dir) {
		var exec = openssl(dir),
			genrsa = [
				'genrsa',
				'-out', hostname + '.key',
				'1024'
			],
			req = [
				'req',
				'-new',
				'-subj', '/C=CN/ST=ZHEJIANG/L=HANGZHOU/O=Alibaba/OU=B2B-F2E/CN=' + hostname,
				'-key', hostname + '.key',
				'-out', hostname + '.csr'
			],
			x509 = [
				'x509',
				'-req',
				'-days', '7305',
				'-CA', ROOT_CER,
				'-CAkey', ROOT_KEY,
				'-set_serial', hash(hostname),
				'-in', hostname + '.csr',
				'-out', hostname + '.cer'
			],
			tmp;

		if (exec) {
			batch(exec, [ genrsa, req, x509 ], function (err) {
				if (err) {
					console.log('[!] %s', err.message);
				} else {
					console.log('create: %s', path.join(dir, hostname + '.cer'));
					console.log('create: %s', path.join(dir, hostname + '.key'));
					console.log('\n..done');
				}

				// Remove temp file.
				fs.unlink(path.join(dir, hostname + '.csr'));
			});
		} else {
			console.log('[!] Please install OpenSSL first.');
		}
	},

	/**
	 * Generate unique serial number.
	 * @param hostname {string}
	 * @return {string}
	 */
	hash = function (hostname) {
		return '0x' + crypto
			.createHash('md5')
			.update(hostname, 'utf8')
			.digest('hex');
	},

	/**
	 * Generate command.
	 * @param cwd {string}
	 * @return {Function|null}
	 */
	openssl = function (cwd) {
		var dirnames = process.env['PATH'],
			separator = process.platform === 'win32' ?
				';' : ':',
			len, i, exec, options;

		dirnames = dirnames ? dirnames.split(separator) : [];

		for (i = 0, len = dirnames.length; i < len; ++i) {
			exec = path.join(dirnames[i], 'openssl');
			if (fs.existsSync(exec)) { // Found unix-like binary.
				break;
			}

			exec += '.exe';
			if (fs.existsSync(exec)) { // Found Windows binary.
				break;
			}

			exec = null;
		}

		return exec ? function (args, callback) {
				cp.execFile(exec, args, { cwd: cwd }, callback);
			} : null;
	};

module.exports = ca;
