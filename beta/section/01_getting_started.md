入门
-------------------

### 安装

	$ npm install tianma@beta

### 使用

`Callback`方式：

	var tianma = require('tianma');
	
	tianma(8080)
		.use(function (next, done) { // x-response-time
			var start = new Date;
			next(function (err) {
				if (!err) {
					this.response.head('x-response-time', new Date - start);
				}
				done(err);
			});
		})
		.use(function (next, done) { // response
			this.response.data('Hello World!');
			done();
		});
		
	------
	$ node app.js
	
`Generator`方式：

	var tianma = require('tianma');
	
	tianma(8080)
		.use(function* (next) {  // x-response-time
			var start = new Date;
			yield next;
			this.response.head('x-response-time', new Date - start);
		})
		.use(function* (next) { // response
			this.response.data('Hello World!');
		});
		
	------
	$ node --harmony app.js
