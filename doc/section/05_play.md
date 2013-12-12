云配置
-------------------

当同一个天马配置文件需要提供给多人使用时，每个人复制一份配置文件到自己的机器上不但麻烦，而且不利于统一维护和更新。使用云配置可以解决这个问题。

### 使用方法

可以按以下方式使用`tianma.play`方法加载和运行云配置。

	tianma.play('http://www.example.com/config.js');

可以看到，云配置文件存放在某台远程服务器上。本地服务器第一次使用某个配置文件时，会先将配置文件缓存到本地后再运行。而后续使用时，如果远程服务器上的配置文件的最后修改日期未发生变化，或者连接不上远程服务器，则继续使用本地缓存的版本，否则会先更新本地缓存后再运行新的配置文件。`play`方法支持`http:`、`https:`和`file:`三种协议。

另外，云配置文件本身也是可配置的，示例如下：

	tianma.play('http://www.example.com/config.js', {
		root: '/home/user/htdocs/'
	});

可以看到，以上配置文件允许用户自定义网站根目录。

### 编写方法

编写一个云配置文件和编写普通的天马配置文件类似，只是云配置文件中可以直接访问通过`play`方法传入的`config`对象，示例如下。

	var tianma = require('tianma'),
		pipe = tianma.pipe;

	tianma
		.createHost({ port: config.port || 80 })
			.mount('/', [
				pipe.static({ root: config.root || './htdocs' })
			])
			.start();

以上云配置文件实现了一个静态服务器，允许用户自行配置服务器端口和网站根目录，并提供了默认配置项。