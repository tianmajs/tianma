内置模块
-------------------

天马内置了一些常用模块，合理组合之后能满足很多常见需求。

### auth

>	该模块在用户首次访问服务时提示用户输入*账户*和*密码*进行身份认证。如果认证通过，该模块把请求交给后续模块继续处理，否则直接返回*403*响应，并继续提示用户验证身份。

+ 通过键值对方式配置一到多个账户和*明文*密码。

		tianma()
			.auth({
				'root': '12345',
				'admin': 'abcde'
			})
			.static()

+ 密码可以是经过`MD5`算法加密后的*密文*，以`#`打头。

		tianma()
			.auth({
				'root': '#827ccb0eea8a706c4c34a16891f84e7b',
				'admin': '#ab56b4d92b40713acc5af89985d4b786'
			})
			.static()

### cache

>	该模块将后续模块对*GET*请求的*200*响应缓存起来。在缓存有效期内，如果再次有URL相同的GET请求到达，该模块就直接返回缓存内容。

+ 缓存有效期默认为1800秒。

		tianma()
			.cache()
			.static()

+ 将缓存有效期置为3600秒。

		tianma()
			.cache(3600)
			.static()

### combo

>	当到达的*GET*请求的URL匹配以下格式时：
>	
>		/base/??path1,path2,...,pathN?query
>	
>	该模块将请求拆解为以下N个独立的请求后分别交给后续模块处理：
>	
>		/base/path1?query
>		/base/path2?query
>		...
>		/base/pathN?query
>	
>	如果后续模块返回的所有响应的`Content-Type`一致，该模块就将所有响应内容合并后返回。

+ *默认配置*下，合并JS或CSS时使用`\n`作为*内容分隔符*，合并其它类型文件时不使用分隔符。

		tianma()
			.combo()
			.static()

+ *自定义*文件内容分隔符。

		tianma()
			.combo({ "js": ";", "css": "\n" })
			.static()

### compress

>	如果到达的请求支持`gzip`或`deflate`两种压缩方式，该模块会对后续模块返回的响应进行*数据压缩*。

+ *默认配置*下，对`js`、`css`和`html`启用压缩。

		tianma()
			.combo()
			.static()

+ *自定义*需要压缩的文件类型。

		tianma()
			.combo('js', 'css', 'svg')
			.static()

### dynamic

>	如果后续模块返回的响应是一个HTML页面，该模块将响应内容作为一个[Micro Template](http://ejohn.org/blog/javascript-micro-templating/)进一步渲染后再返回。
>	
>	例如后续模块返回了以下HTML页面：
>
>		<!DOCTYPE html>
>		<ul>
>		<% items.forEach(function (value) { %>
>			<li><%=value%></li>
>		<% }); %>
>		<ul>
>
>	当上下文对象配置为`{ items: [ 'foo', 'bar' ] }`时，渲染后的页面如下：
>
>		<!DOCTYPE html>
>		<ul>
>			<li>foo</li>
>			<li>bar</li>
>		<ul>

+ *预先指定*上下文对象。

		tianma()
			.dynamic({ items: [ 'foo', 'bar' ] })
			.static()

+ *动态生成*上下文对象。

		tianma()
			.dynamic(function (req, res) {
				return {
					items: [ req.hostname, req.pathname ]
				};
			})
			.static()

### refresh

>	如果到达的请求路径（`req.pathname`）满足*匹配规则*，并且包含`Cache-Control: no-cache`头字段（通常由CTRL+F5产生），该模块会检查*目标目录*下的文件是否有*变更*，并在有变更时在目标目录下运行*终端命令*，并在命令运行*完毕后*，再将请求交给后续模块处理。

+ *快捷配置*下只需要指定要运行的*终端命令*，匹配规则默认匹配*任意路径*，目标目录默认使用*工作目录*。

		tianma()
			.refresh('grunt build')
			.static('./build')

+ *自定义*目标目录和匹配规则。

		tianma()
			.refresh({
				action: 'grunt build',
				target: './assets',
				pattern: /^\/assets/
			})
			.static()

+ 根据URL匹配结果*动态指定*目标目录。

		tianma()
			.refresh({
				action: 'grunt build',
				target: './$1',
				pattern: /^\/(.*?)\//
			})
			.static()

### rewrite

>	如果到达的请求路径加参数（`req.path`）满足*匹配规则*，则根据*目标地址*的类型，该模块或对请求进行*路径重定向*，或进行*服务端代理*。

+ 将任意请求*重定向*到某个目录下。

		tianma()
			.rewrite({
				'/build$1': /^(.*)/
			})
			.static()

+ 将对指定目录的请求*代理*到远程服务器。

		tianma()
			.rewrite({
				'/build$1': /^(.*)/,
				'http://download.example.com$1': /^(\/file\/.*)/
			})
			.static()

### static

>	该模块使用指定的根目录提供*静态文件服务*。如果根目录下存在请求的文件或目录，该模块直接返回*200*响应，否则该模块将响应置为*404*后，将请求继续交给后续模块处理。

+ *默认配置*下，使用工作目录作为根目录。

		tianma()
			.static()

+ 使用*快捷配置*指定根目录路径。

		tianma()
			.static('./htdocs')

+ 请求的是一个目录时，可被自动重定向到指定的*索引文件*。

		tianma()
			.static({ root: './htdocs', indexes: [ 'index.html', 'default.html' ] })

+ 请求的是一个目录时，可*禁用*自动目录索引功能，改为返回一个*403*响应。

		tianma()
			.static({ root: './htdocs', indexes: false })

### use

>	使用*自定义模块*或*第三方模块*。使用第三方模块时，天马会在当前*配置文件所在目录*下查找并使用与指定模块名和版本号匹配的模块。如果没有找到，天马会使用*NPM*自动下载安装指定的模块。

+ 使用自定义模块。

		tianma()
			.use(function (req, res) {
				res.status(200).data('Hello World!');
				res();
			})

+ 通过*模块名*使用第三方模块，并传入模块配置。

		tianma()
			.use('tianma-uglifyjs', { mangle: true })
			.static()

+ 指定第三方模块*版本号*。

		tianma()
			.use('tianma-uglify@2.3.x')
			.static()

+ 指定第三方模块版本号和所在*仓库地址*。

		tianma()
			.use('http://r.cnpmjs.org/tianma-uglify@2.3.x')
			.static()
