自定义模块
-------------------

当内置模块无法满足需求时，可以尝试编写*自定义模块*。自定义模块是一个函数，使用传入的`request`和`response`对象处理HTTP请求和响应。

	tianma()
		.use(function (req, res) {          // 使用自定义模块
			if (req.method() === 'GET') {
				res.status(200).data('200 OK');
			} else {
				res.status(403).data('403 Forbidden');
			}
			res();
		})

### request

`request`对象包含了HTTP请求相关数据，对象上的所有方法支持*链式调用*。使用`request`对象时，虽然大多数情况下只需要从中*读取数据*，但是在例如请求重定向等情况下，就需要*修改数据*。

#### .accepts

>	判断请求是否支持某种类型。

+ 通过文件类型或MIME来判断。

		request
			.head('accept', 'text/html,text/css')

		request
			.accepts('html')  // => 'html'
		request
			.accepts('text/html')  // => text/html
		request
			.accepts('text/*')  // => text/html
		request
			.accepts('text/plain')  // => false

+ 提供多组判断条件。

		request
			.head('accept', 'text/html,text/css')

		request
			.accepts('js', 'html')  // => 'html'
		request
			.accepts('js', 'css')  // => false

#### .acceptsCharsets

>	判断请求是否支持某种文本编码。

+ 支持一到多组判断条件。

		request
			.head('accept-charset', 'utf-8,utf-7;q=0.7')

		request
			.acceptsCharsets('utf-8', 'utf-7')  // => 'utf-8'
		request
			.acceptsCharsets('gbk')  // => false

+ 读取支持的所有语言，自动忽略掉`Accept-Charset`中的参数。

		request
			.head('accept-charset', 'utf-8,utf-7;q=0.7')

		request
			.acceptsCharsets()  // => [ 'utf-8', 'utf-7' ]

#### .acceptsEncodings

>	判断请求是否支持某种数据压缩格式。

+ 支持一到多组判断条件。

		request
			.head('accept-encoding', 'gzip,deflate')

		request
			.acceptsEncodings('gzip', 'deflate')  // => 'gzip'
		request
			.acceptsEncodings('sdch')  // => false

+ 读取支持的所有压缩格式。

		request
			.head('accept-encoding', 'gzip,deflate')

		request
			.acceptsEncodings()  // => [ 'gzip', 'deflate' ]

#### .acceptsLanguages

>	判断请求是否支持某种语言。

+ 支持一到多组判断条件。

		request
			.head('accept-language', 'en-US,zh-CN;q=0.7')

		request
			.acceptsLanguages('en-US', 'zh-CN')  // => 'en-US'
		request
			.acceptsLanguages('zh-TW')  // => false

+ 读取支持的所有语言，自动忽略掉`Accept-Language`中的参数。

		request
			.head('accept-language', 'en-US,zh-CN;q=0.7')

		request
			.acceptsLanguages()  // => [ 'en-US', 'zh-CN' ];

#### .charset

>	读取或修改请求使用的文本编码，默认值由创建主机时的配置决定。

	request
		.charset('gbk')
		.charset()  // => 'gbk'

#### .cookie

>	读取Cookie字段。

	request
		.head('cookie', 'foo=1&bar=2')
		.cookie('foo') // => '1'

	request
		.cookie('baz')  // => ''

#### .data

>	以二进制形式读取或修改请求数据。

+ 读写请求数据。

		request
			.data(new Buffer('Hello'))
			.data()  // => <Buffer 48 65 6c 6c 6f>

+ 以字符串形式修改请求数据，字符串按照当前文本编码*自动转换*为二进制数据。

		request
			.data('Hello')
			.data()  // => <Buffer 48 65 6c 6c 6f>

+ 使用*数组*修改请求数据。

		request
			.data([ 'He', new Buffer('llo') ])
			.data()  // => <Buffer 48 65 6c 6c 6f>

#### .form

>	读取表单数据中的某个字段。

+ 通过*字段名*读取*普通*字段。

		// <input type="text" name="username" />
		request
			.form('username') // => 'Jim Green'

+ 通过*字段名*读取*文件*字段。

		// <input type="file" name="photo" />
		var photo = request.form('photo')

		photo           // => <Buffer FF D8 FF E1 2E A5 45 78 ...>
		photo.mime      // => 'image/png'
		photo.filename  // => 'jim_green.png'

#### .head

>	读取或修改请求头字段。

+ 修改和读取单个头字段。

		request
			.head('host', 'example.com')
			.head('host')  // => 'example.com'

+ 批量修改多个头字段，并读取整个请求头。

		request
			.head('host', 'example.com')
			.head({
				'host': 'sample.com',
				'referer': 'http://localhost/'
			})
			.head()  // => { host: 'sample.com', referer: 'http://localhost/' }

#### .ip

>	读取或修改请求来源IP。

	request
		.ip('127.0.0.1')
		.ip()  // => '127.0.0.1'

#### .is

>	判断请求是否属于某种类型。

+ 通过文件类型或MIME来判断。

		request
			.type('html')

		request
			.is('html')  // => 'html'
		request
			.is('text/html')  // => 'text/html'
		request
			.is('text/*')  // => 'text/html'
		request
			.is('css')  // => false

+ 提供多组判断条件。

		request
			.type('html')

		request
			.is('css', 'html')  // => 'html'
		request
			.is('css', 'js')  // => false

#### .method

>	读取或修改请求方法。

	request
		.method('post')
		.method()  // => 'POST'

#### .toString

>	以字符串形式读取请求数据。

	request
		.data(new Buffer('Hello'))
		.toString()  // => "Hello"

	request + '!';  // => 'Hello!'

#### .type

>	读取或修改请求类型。

+ 读取请求类型，自动忽略掉`Content-Type`中例如`charset`的参数。

		request
			.head('content-type', 'text/html; charset=utf-8')
			.type()  // => text/html

+ 通过多种方式修改请求类型，并根据当前*文本编码*自动在`Content-Type`中加上`charset`参数。

		request
			.type('text/html')
			.head('content-type')  // => text/html; charset=utf-8

		request
			.type('html')
			.head('content-type')  // => text/html; charset=utf-8

		request
			.type('.html')
			.head('content-type')  // => text/html; charset=utf-8

		request
			.type('index.html')
			.head('content-type')  // => text/html; charset=utf-8

#### .url

>	读取或修改请求URL。读取时，总是返回完整URL。修改时，可以传入完整URL或URL片段。一个完整的URL由以下片段组成：
>
>		                            host              path
>		                      --------------- ----------------------
>		 http: // user:pass @ host.com : 8080 /p/a/t/h ?query=string
>		 -----    ---------   --------   ---- -------- -------------
>		protocol     auth     hostname   port pathname     search

+ 使用*完整*URL或URL*片段*修改URL。

		request
			.url('http://hostname/path/name?key=value')  // 修改整个URL
			.url()  // => 'http://hostname/path/name?key=value'

		request
			.url('https:')  // 修改协议头
			.url()  // => 'https://hostname/path/name?key=value'

		request
			.url('//example.com')  // 修改域名
			.url()  // => 'https://example.com/path/name?key=value'

		request
			.url('/foo/bar')  // 修改路径
			.url()  // => 'https://example.com/foo/bar?key=value'

		request
			.url('?a=b')  // 修改参数
			.url()  // => 'https://example.com/foo/bar?a=b'

+ 通过**只读属性**读取当前URL的各个片段。URL修改后，各属性值会*自动更新*。

		request
			.url('http://user:pass@host.com:8080/p/a/t/h?query=string')

		request.protocol  // =>  'http:'
		request.auth      // =>  'user:pass'
		request.hostname  // =>  'host.com'
		request.port      // =>  '8080'
		request.host      // =>  'host.com:8080'
		request.pathname  // =>  '/p/a/t/h'
		request.search    // =>  '?query=string'
		request.path      // =>  '/p/a/t/h?query=string'

+ 通过**只读属性**读取`search`片段的键值对*解析结果*。

		request
			.url('?foo=1&foo=2&bar=3')
			.query  // => { foo: [ '1', '2' ], bar: '3' }

### response

`response`对象包含了HTTP响应相关数据，对象上的所有方法支持*链式调用*。

#### .charset

>	读取或修改响应使用的文本编码，默认值由创建主机时的配置决定。使用方法同`request.charset`。

#### .cookie

>	向响应头中添加一个`Set-Cookie`字段。

+ 通过*字段名*和*字段值*添加一个Cookie。

		response
			.cookie('foo', 'bar')
			.cookie('bar', 'baz')
			.head('set-cookie')  // => [ 'foo=bar;', 'bar=baz' ]

+ 指定Cookie参数。

		response
			.cookie('foo', 'bar', {
				maxAge: 0,
				domain: 'localhost',
				path: '/',
				expires: new Date(),
				httpOnly: true,
				secure: true
			})
			.head('set-cookie')  // => 'foo=bar; Domain=localhost; Path=/; Expires=Tue, 04 Dec 2012 03:03:14 GMT; HttpOnly; Secure'

#### .data

>	以二进制形式读取或修改响应数据，使用方法同`request.data`。

#### .head

>	读取或修改响应头字段，使用方法同`request.head`。

#### .is

>	判断响应是否属于某种类型，使用方法同`request.is`。

#### .toString

>	以字符串形式读取响应数据，使用方法同`request.toString`。

#### .type

>	读取或修改响应类型，使用方法同`request.type`。

#### .status

>	读取或修改响应状态码。

	response
		.status(200)
		.status();  // => 200

### 设计模式

在编写自定义模块时，有以下三种常用模式：

+ 模块可以在处理完请求后，直接通过`res()`返回响应。如果在处理过程中有异常发生，模块可以通过`res(err)`抛出异常，天马会自动返回一个500响应。

		// 读取请求的文件
		function readFile(req, res) {
			fs.readFile(req.pathname, function (err, data) {
				if (err) {
					res(err);    // 抛出异常
				} else {
					res.status(200).data(data);
					res();       // 返回响应
				}
			});
		}

		tianma()
			.use(readFile)

+ 模块可以先部分处理请求，然后通过`req(callback)`将请求交后给后续模块处理，待后续模块完成处理后，再接着完成剩余工作。

		// 统计后续模块处理请求的耗时
		function profile(req, res) {
			var start = new Date;     // 完成部分工作

			req(function (err) {      // 将请求交给后续模块
				if (err) {            // 原样抛出后续模块产生的异常
					res(err);
				} else {              // 完成剩余工作
					res.head('x-process-time', new Date - start);
					res();
				}
			});
		}

		tianma()
			.use(profile)
			.use(readFile)

+ 模块可以多次通过`req(callback)`将修改后的请求交给后续模块处理并收集处理结果，并最终返回一个总体响应。

		// 简单处理文件形如`/base/??file1,file2`的合并请求
		function combo(req, res) {
			var parts = req.path.split('??'),
				base = parts[0],
				pathnames = parts[1].split(','),
				data = [];

			(function next(i) {
				if (i < pathnames.length) {
					req.url(base + pathnames[i]);   // 将请求路径修改为某个文件路径
					req(function (err) {            // 将请求交给后续模块
						if (err) {
							res(err);               // 发生任何异常时直接抛出
						} else {
							data.push(res.data());  // 收集请求处理结果
							next(i + 1);            // 再来一次
						}
					});
				} else {                            // 所有文件请求完成
					res.data(data);
					res();
				}
			}(0));
		}

		tianma()
			.use(combo)
			.use(readFile)

### Generator

如果天马运行在NodeJS `v0.11.x`版本以上，还可以使用*Generator*编写模块，以简化*异步操作*与*异常处理*。并且，Generator模块中*不需要*显示调用`res()`来返回响应。

	// 使用Generator简化上例中profile函数的编写
	function* profile(req, res) {
		var start = new Date;                          // 完成部分工作
		yield req;                                     // 将请求交给后续模块
		res.head('x-process-time', new Date - start);  // 完成剩余工作
	}

	// 使用Generator简化上例中combo函数的编写
	function* combo(req, res) {
		var parts = req.path.split('??'),
			base = parts[0],
			pathnames = parts[1].split(','),
			data = [];

		for (var i = 0, len = pathnames.length; i < len; ++i) {
			req.url(base + pathnames[i]);           // 将请求路径修改为某个文件路径
			yield req;                              // 将请求交给后续模块
			data.push(res.data());
		}

		res.data(data);                             // 所有文件请求完成
	}

	tianma()
		.use(profile)   // 使用Generator
		.use(combo)     // 使用Generator
		.use(readFile)  // 使用普通函数
