请求
-------------------


`request`对象包含了HTTP请求相关数据，对象上的所有方法支持*链式调用*。使用`request`对象时，虽然大多数情况下只需要从中*读取数据*，但是在例如请求重定向等情况下，就需要*修改数据*。

### .accepts

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

### .acceptsCharsets

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

### .acceptsEncodings

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

### .acceptsLanguages

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

### .cookie

>	读取Cookie字段。

	request
		.head('cookie', 'foo=1&bar=2')
		.cookie('foo') // => '1'

	request
		.cookie('baz')  // => ''

### .data

>	读取或修改请求数据。

+ 以`Stream`方式读取请求数据。

		request
			.data().pipe(...
			
+ 自动把`Stream`合并为`Buffer`或`string`之后读取请求数据。

		request
			.data(function (err, data) {
				// ...
			});
			
		- or -
		
		try {
			var data = yield request.data;
		} catch (err) {
			// ...
		}
			
+ 写入一个`Buffer`或`string`。

		request
			.data(new Buffer('Hello'))
			.data('Hello')

+ 写入一个`ReadableStream`。

		request
			.data(fs.createReadStream(__filename))

### .head

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

### .ip

>	读取或修改请求来源IP。

	request
		.ip('127.0.0.1')
		.ip()  // => '127.0.0.1'

### .is

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

### .method

>	读取或修改请求方法。

	request
		.method('post')
		.method()  // => 'POST'

### .type

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

### .url

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
