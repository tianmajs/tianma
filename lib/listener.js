'use strict';

var mu = require('mini-util'),
	Request = require('./request'),
	Response = require('./response');

/**
 * The native HTTP listener.
 * @param request {Object}
 * @param response {Object}
 * @param filter {Function}
 */
module.exports = function(request, response, filter) {
	var protocol = request.connection.encrypted
			? 'https:' : 'http:',
			
		url = protocol + '//' + request.headers.host
			+ request.url,
			
		req = new Request({
			url: url,
			method: request.method,
			ip: request.client.remoteAddress,
			headers: request.headers,
			data: request
		}),
		
		res = new Response({}),
			
		context = {};
		
	Object.defineProperty(context, 'request', { value: req });
	Object.defineProperty(context, 'response', { value: res });

	filter(context, function (err) {
		if (err) {
			response.writeHead(500);
			response.end(err.stack);
		} else {
			response.writeHead(res.status(),
				res.head('content-length', '').head());
			res.data().pipe(response);
		}
	});
};