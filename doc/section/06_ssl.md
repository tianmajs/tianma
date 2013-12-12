SSL证书
-------------------

搭建HTTPS服务器时需要为提供服务的域名配置SSL证书。天马不但简化了自制证书的制作过程，也简化了证书的配置方式。

### 证书制作

如果还没有从颁发机构购买证书，或者因各种原因得不到生产环境使用的证书，至少在开发环境下可以自己做一个。天马命令行工具封装了OpenSSL，可以简单制作出某个域名用的公钥和私钥。以下是为`www.example.com`域名制作证书的一个示例。

	$ tianma ca www.example.com
	create: www.example.com.cer
	create: www.example.com.key

	..done

#### 安装根证书

使用`tianma ca`命令制作的证书都基于天马根证书颁发，为了避免使用自制证书时遭遇浏览器安全警告，需要在浏览器中安装天马根证书。使用`tianma deploy`命令部署一个工作目录后，天马根证书位于`certificates/tianma.cer`，请按照以下说明安装。

+ IE

	双击`tianma.cer`，在弹出的对话框中选择`安装证书`，证书安装位置手动指定为`受信任的根证书颁发机构`，完成。

+ Chrome

	Windows系统下Chrome与IE共用一套证书系统，只需完成IE的安装步骤即可。*nix系统下按照`设置` -> `显示高级设置` -> `管理证书`的顺序打开对话框后，按照类似IE下的步骤安装根证书。

+ Firefox

	按照`选项` -> `高级` -> `加密` -> `查看证书` -> `认证` -> `导入`的顺序，打开`tianma.cer`之后，在弹出的对话框中勾选上`使用该证书认证网站`，完成。

+ 其它浏览器

	依葫芦画瓢吧。

#### 安装OpenSSL

一般*nix系统下自带OpenSSL，而Windows系统木有。运行`tianma ca`命令时如果提示要先安装OpenSSL时，Windows用户可以在以下位置找到合适的安装包。

>	http://slproweb.com/products/Win32OpenSSL.html

之后按以下步骤安装。

1. 根据系统是32位还是64位，分别下载和安装`Visual C++ 2008 Redistributables / Visual C++ 2008 Redistributables (x64)`以及`Win32 OpenSSL v1.0.1c / Win64 OpenSSL v1.0.1c`。

2. 按照`我的电脑` -> `右键` -> `属性` -> `高级` -> `环境变量`的顺序打开环境变量设置对话框。

3. 假设默认安装到了`C:\OpenSSL-Win32`，把`C:\OpenSSL-Win32\bin`目录添加到PATH环境变量末尾，不同目录之间使用`;`分隔。

4. 新增一个环境变量`OPENSSL_CONF`，设置为`C:\OpenSSL-Win32\bin\openssl.cfg`。

5. 重启系统生效。

### SNI

天马服务器支持SNI技术，可以根据HTTPS请求使用的域名动态返回相应的证书，因此可以在一台服务器上使用多个域名提供不同服务。该功能使用简单，只要把每个域名的公钥和私钥文件放在工作目录下的`certificates/`子目录中，并让文件名与域名相同即可。例如有以下工作目录。

	- /home/user/www/
		- certificates/
			www.example.com.cer
			www.example.com.key
		config.js

并且`config.js`内容如下。

	require('tianma')
		.createHost({ portssl: 443 })
			.mount('www.example.com', [])
			.start();

启动服务后，当HTTPS请求使用`www.example.com`这个域名时，服务器会自动使用`certificates/`目录下对应的证书提供服务。

#### 降级方案

Wndows XP系统下的IE不支持SNI技术，如果要解决这部分浏览器的证书问题的话，有以下两个方案：

+ 放弃SNI，只使用一个域名提供服务，并在创建主机时直接使用`cert`和`key`字段指定域名证书。

+ 如果只想在开发或测试环境不让IE弹出证书安全警告的话，按照`Internet选项` -> `高级` -> `安全` -> `对无效站点证书发出警告`的顺序把勾选框去掉。
