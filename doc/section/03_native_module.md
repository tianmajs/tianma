内置模块
-------------------

天马提供了一些内置模块，合理组合之后能解决很多问题。内置模块使用[`pegasus.createPipe`](http://nqdeng.github.io/pegasus/#3.4)方法编写，因此在使用前需要先实例化，在处理每个请求前需要先判定生效条件。

### cache

>	tianma.pipe.cache(pipeline, config)

缓存模块，为HTTP GET请求提供客户端缓存支持。

+ pipeline:Array = []

	子流水线，用于装填需要缓存响应结果的模块。

+ config.expires:number = 1800

	缓存有效期，秒单位。

该模块完成以下两项工作：

1. 使用子流水线处理普通请求后，为GET请求的200响应头添加客户端缓存字段。

2. 检查后续收到的条件GET请求是否在有效期内，有效时返回304响应，无效时重复第1项工作。

#### 生效条件

无限制。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe.cache([
					tianma.pipe.static({ root: './htdocs' })
				])
			])
			.start();

以上代码实现了带客户端缓存的静态文件服务器。客户端第一次请求某个URL后，收到的是指定了半小时缓存的200响应。客户端如果在半小时内第二次条件请求同一URL，收到的将是304响应，否则收到的是重新指定了缓存有效期的200响应。

### combo

>	tianma.pipe.combo(config)

请求合并模块，用于将多个同类型的GET请求合并为一个。

+ config.source:string = 'loop://<当前请求域名>/'

	源服务器地址，可以使用[`context.request`](http://nqdeng.github.io/pegasus/#4.3)方法支持的任何格式的地址。

+ config.strict:boolean = true

	是否不容忍任何异常的GET请求。

+ config.separator:Object = { '.js': '\n;\n', '.css': '\n' }

	为不同扩展名的文件指定合并时使用的分隔符，未指定时不使用分隔符。

该模块除了支持处理`/foo/??bar.js,baz.js`形式的文件合并请求外，还支持`/foo/bar.js`这种普通请求。该模块会去源服务器（例如为`http://localhost/`）读取请求的文件（例如`http://localhost/foo/bar.js`和`http://localhost/foo/baz.js`）后，使用指定的分隔符合并文件内容后返回响应。

当源服器在处理某个请求后返回的不是200响应时，根据配置，该模块可选择将整个合并请求视作异常，或是忽略掉部分异常后返回正常响应的内容合并结果。

#### 生效条件

1. 传入的响应状态码等于`404`。

2， 传入的请求方法等于`GET`。

3. 传入的请求不是由combo模块自身发起的。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe.combo(),
				tianma.pipe.static({ root: './htdocs' })
			])
			.start();

以上代码实现了一个静态文件合并服务器。当请求`http://localhost/foo/??bar.js,baz.js`到达combo模块后，会按照以下流程处理：

1. 由于使用默认配置，combo模块使用`loop://localhost/`作为源服务器，并接着发起`loop://localhost/foo/bar.js`和`loop://localhost/foo/baz.js`两个子请求。

2. 子请求再次到达combo模块后，combo模块会忽略掉自身发起的请求。

3. 子请求接着到达static模块被处理。

4. combo模块收到两个子请求的响应后依次合并内容，并最终返回响应。

### compress

>	tianma.pipe.compress(config)

HTTP压缩模块，用于压缩响应体数据。

+ config.extnames:Array = [ '.js', '.css', '.html' ]

	需要启用压缩的文件扩展名。

#### 生效条件

1. 传入的响应状态码等于`200`。

2. 传入的请求头中包含`accept-encoding`字段，并且申明支持`gzip`或`deflate`压缩方式。

3. 传入的响应头中包含`content-type`字段，并且其中的MIME与`config.extnames`中的某个扩展名匹配。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe.static({ root: './htdocs' }),
				tianma.pipe.compress()
			])
			.start();

以上代码实现了一个带HTTP压缩功能的静态文件服务器。

### debug

>	tianma.pipe.debug()

代码调试模块，用于将包裹在以下格式的注释中的调试代码反注释，使之生效。

	/*@debug
		console.log('debug');
	*/

#### 生效条件

1. 传入的响应状态码等于`200`。

2. 传入的响应头中包含`content-type`字段，并且其中的MIME与JS或CSS文件匹配。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe.static({ root: './htdocs' }),
				tianma.pipe.debug()
			])
			.start();

以上代码实现了一个静态文件调试服务器，可以将JS或CSS代码中的调试注释反注释掉。

### dynamic

>	tianma.pipe.dynamic(config)

动态内容模块，用于渲染模板。

+ config.extname:string = '.psp'

	模板文件扩展名。

该模块支持渲染使用类似[ASP JavaScript](http://www.w3school.com.cn/asp/index.asp)的语法编写的模块，并部分支持[SSI](http://www.w3school.com.cn/asp/asp_incfiles.asp)语法。以下是一个示例模板。

	<!DOCTYPE html>
	<!-- #include virtual="./head.inc" -->
	<body>
	<dl>
	<dt>Request URL:</dt>
	<dd><% response.write(request.href); %></dd>
	<dt>Request Method:</dt>
	<dd><%= request.method %></dd>
	</dl>
	</body>
	</html>

在模板中，包含在`<% %>`之间的JS代码可以直接用变量名访问`context`对象的成员，而`<%= xxx %>`是`<% response.write(xxx); %>`的语法糖。

#### 生效条件

1. 传入的响应状态码等于`200`。

2. 传入的请求地址的扩展名与`config.extname`相同。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				function (context, next) {
					// Put template variables into context.
					next();
				},
				tianma.pipe.static({ root: './tmpl' }),
				tianma.pipe.dynamic()
			])
			.start();

以上代码实现了一个动态服务器，可根据请求路径先准备好模块变量，再使用static模块读取模板文件，再使用dynamic模块渲染模板后输出响应。

### modular

>	tianma.pipe.modular(config)

JS模块化模块，遵循[CMD](http://wiki.commonjs.org/wiki/CommonJS)规范。

+ config.auto:boolean = false

	编写CMD模块时是否可以省略掉使用`define`函数包裹代码的步骤。

该模块支持为CMD匿名模块自动加上模块ID和依赖信息。例如有`foo/bar.js`内容如下：

	define(function (require, exports, module) {
		exports.baz = require('./baz');
	});

经过modular模块转换后内容变为：

	define("foo/bar.js", [ "./baz" ], function (require, exports, module) {
		exports.baz = require('./baz');
	});

另外，如果`config.auto`配置为`true`，`foo/bar.js`的内容可以简写如下：

	exports.baz = require('./baz');

#### 生效条件

1. 传入的响应状态码等于`200`。

2. 传入的响应头中包含`content-type`字段，并且其中的MIME与JS文件匹配。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe.static({ root: './htdocs' }),
				tianma.pipe.modular()
			])
			.start();

以上代码实现了一个CMD模块服务器，浏览器端可以使用[SeaJS](http://seajs.org/docs/)等CMD模块管理器来加载JS模块。

### pipe

>	tianma.pipe.pipe(pipeline)

管道模块，用于将一个流水线转换为单个模块使用。

+ pipeline:Array = []

	需要转换为单个模块使用的流水线。

即使在同一个流水线中，有时候需要为不同的请求提供不同的处理流程，此时就可以使用该模块来简化代码的组织和编写。

#### 生效条件

无限制。

#### 示例

	var action1 = tianma.pipe.pipe([
			function (context, next) { /* Do something */ },
			function (context, next) { /* Do something */ }
		]),

		action2 = tianma.pipe.pipe([
			function (context, next) { /* Do something */ }
		]);

		tianma
			.createHost({ port: 80 })
				.mount('/', [
					function (context, next) {
						if (context.request.method === 'GET') {
							action1(context, next);
						} else {
							action2(context, next);
						}
					}
				])
				.start();

以上代码根据请求方法使用了不同的处理流程。

### proxy

>	tianma.pipe.proxy(config)

反向代理模块，用于在服务端转发请求。

+ config:Object = {}

	为不同的URL分别定义代理规则。

可以通过键值对方式配置多组`target(字符串) : pattern(正则)`代理规则，当一个请求到达该模块时，会按以下流程处理：

1. 首先使用`url.match(pattern)`的方式依次使用每条代理规则匹配请求的完整URL。

2. 如果匹配成功，使用匹配结果替换掉`target`中的`$n`占位符。

3. 使用替换之后的`target`转发请求。

另外，由于proxy模块使用[`context.request`](http://nqdeng.github.io/pegasus/#4.3)方法转发请求，因此`target`可以使用该方法支持的任何格式的地址。

#### 生效条件

1. 传入的响应状态码等于`404`。

2. 传入的请求的完整URL与某条代理规则匹配。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe.static({ root: './htdocs' }),
				tianma.pipe.proxy({
					'http://assets.example.com/$1': /\/\/.*?\/(.*)/
				})
			])
			.start();

以上代码实现了一个具备服务端代理功能的静态文件服务器。当请求的文件在本地不存在时，服务器会去远程服务器读取请求的文件并返回结果。

### redirect

>	tianma.pipe.redirect(config)

请求重定向模块，用于在请求处理过程中更改请求路径。

+ config:Object = {}

	为不同的路径分别定义重定向规则。

可以通过键值对方式配置多组`target(字符串): pattern(正则)`代理规则，当一个请求到达该模块时，会按以下流程处理：

1. 首先使用`pathname.match(pattern)`的方式依次使用每条代理规则匹配请求地址的pathname部分。

2. 如果匹配成功，使用匹配结果替换掉`target`中的`$n`占位符。

3. 使用替换之后的`target`更新当前`request`对象中的相关字段。

#### 生效条件

1. 传入的响应状态码等于`404`。

2. 传入的请求地址的pathname部分与某条重定向规则匹配。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe.redirect({
					'/new/$1': /^\/old\/(.*)$/
				}),
				tianma.pipe.static({ root: './htdocs' })
			])
			.start();

以上代码实现了一个具备请求重定向功能的静态文件服务器，可以将对`/old/*`下所有文件的请求重定向到`/new/*`下边。

### refine

>	tianma.pipe.refine(config)

内容替换模块，用于替换指定类型的响应体内容。

+ config:Object = {}

	为不同文件类型分别定义内容替换函数。

该模块可以对响应体内容做一些简单替换，所有工作都需要在内容替换函数中同步完成。

#### 生效条件

1. 传入的响应状态码等于`200`。

2. 传入的响应头包含`content-type`字段，并且其中的MIME与`config`中的某个扩展名匹配。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe.static({ root: './htdocs' }),
				tianma.pipe.refine({
					'.js': function (data) {
						return jsmin(data);
					}
				})
			])
			.start();

以上代码实现了一个具备JS代码压缩功能的静态文件服务器，在refine模块中配置了JS内容替换函数并使用JSMIN来压缩代码。

### static

>	tianma.pipe.static(config)

静态服务模块，用于从服务器本地读取请求的文件并返回内容。

+ config.root:string = './'

	根目录，可以使用相对或绝对路径。

+ config.indexes:Array = []

	默认索引文件，配置了多个文件时优先级按数组索引顺序从高到低。

该模块根据请求路径（pathnanme）从根目录中读取文件并返回响应。文件存在时返回200响应，否则返回404响应。当请求路径对应某个目录时，如果目录下存在默认索引文件，则改为读取默认索引文件，否则自动生成目录索引。

另外，为了避免*nix与Windows系统对文件名大小写的处理差异导致潜在问题，该模块在Windows系统下也对文件名大小写敏感。

#### 生效条件

1. 传入的响应状态码等于`404`。

#### 示例

	tianma
		.createHost({ port: 80 })
			.mount('/', [
				tianma.pipe.static({
					indexes: [ 'index.html' ], root: './htdocs' })
			])
			.start();

以上代码实现了一个静态网站，使用`./htdocs`作为网站根目录，并使用`index.html`作为默认索引文件。
