配置文件
-------------------

天马HTTP服务器套件构建于[天马HTTP中间件](http://nqdeng.github.io/pegasus/)之上，因此编写天马配置文件类似于使用`tianma`和`pegasus`（可选）两个三方包提供的API来编写一个NodeJS程序。

### 创建主机

主机是提供HTTP服务的基本单位，可以通过`tianma.createHost`方法创建。

	var host = tianma.createHost(config);

#### 端口监听

`port`和`portssl`字段分别用于指定主机需要监听的HTTP和HTTPS端口。缺少某个字段时，主机不监听对应端口。

	tianma
		.createHost({ port: 80, portssl: 443 });

#### SSL证书

`cert`和`key`字段用于指定提供HTTPS服务时使用的公钥和私钥。缺少这两个字段时，默认使用天马根证书。

	tianma
		.createHost({
			cert: 'pathname/of/certificates.cer',  // 公钥文件路径
			key: 'pathname/of/certificates.key',   // 私钥文件路径
			portssl: 443,
		});

天马服务器支持SNI技术，一般不需要手工配置这两个字段，在后边的章节中会有详细介绍。

#### IP绑定

当服务器上有多个IP时，可以通过`ip`字段指定绑定哪个IP提供服务。缺少该字段时，绑定所有IP。

	tianma
		.createHost({ ip: '127.0.0.1', port: 80 });

#### 编码

`charset`字段用于指定主机处理HTTP请求和响应时使用的编码。缺少该字段时，默认使用`utf-8`编码。

	tianma
		.createHost({ charset: 'gbk', port: 80 });

天马支持的编码类型请参考[iconv-lite](https://github.com/ashtuchkin/iconv-lite#supported-encodings)。

### 配置服务

主机根据路由规则，使用相应的流水线来处理HTTP请求，并在完成之后将HTTP响应返回给客户端。这一切都通过主机对象的`.mount`方法来配置。

	tianma
		.createHost({ port: 80 })
			.mount('*.example.com', [
				function (context, next) {
					context.response
						.status(200)
						.write('Hello World');
					next();
				}
			])
			.mount('/', [
				function (context, next) {
					context.response
						.status(500)
						.write('Bad Request');
					next();
				}
			]);

>	**传送门：** 请查看[天马HTTP中间件使用手册](http://nqdeng.github.io/pegasus/)学习路由规则的配置和流水线模块的编写。

### 启动服务

通过主机对象的`.start`方法可以启动服务。存在回调函数时，服务启动后调用回调函数，并传入主机对象。

	tianma
		.createHost({ port: 80 })
			.start(function (host) {});

### 停止服务

通过主机对象的`.stop`方法可以停止服务。存在回调函数时，服务停止后调用回调函数，并传入主机对象。

	tianma
		.createHost({ port: 80 })
			.stop(function (host) {});
