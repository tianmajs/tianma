var crypto = require('crypto'),
	http = require('http'),
	https = require('https'),
	sign = require('./util/sign');

// Cache the dynamically created certificates.
var	certificates = {};

/**
 * Create a secure context dynamically.
 * @param options {Object}
 * @param listener {Function}
 */
function createContext(cn, callback) {
	var context = crypto.createCredentials(
			certificates[cn] || (certificates[cn] = sign(cn))
		).context;
	
	if (callback) { // NodeJS v0.11 ways.
		callback(null, context);
	} else { // Traditional ways.
		return context;
	}
}

/**
 * Create HTTP server.
 * @param options {Object}
 * @param listener {Function}
 */
function create(options, listener) {
	var server;

	var wrapper = function (request, response) {
		listener(request, response, function (err) {
			if (err) {
				var protocol = request.connection.encrypted ?
						'https:' : 'http:',
					host = request.headers.host,
					url = request.url;
			
				console.error('%s\n    at %s//%s%s',
					err.stack, protocol, host, url);
			}
		});
	};

	if (options.port) {
		server = http.createServer(wrapper);
		
		console.log('Listen to http://%s:%s', options.ip, options.port);
		
		server.listen(options.port, options.ip);
		
		server.on('error', function (err) {
			err.vars = [ options.port ];
			throw err;
		});
	}
	
	if (options.portssl) {	
		server = https.createServer({
			cert: sign.DEFAULT_CERT,
			key: sign.DEFAULT_KEY,
			SNICallback: createContext
		}, wrapper);
		
		console.log('Listen to https://%s:%s', options.ip, options.portssl);
		
		server.listen(options.portssl, options.ip);
		
		server.on('error', function (err) {
			err.vars = [ options.portssl ];
			throw err;
		});
	}
}

exports.create = create;
