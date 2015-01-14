响应
-------------------


`response`对象包含了HTTP响应相关数据，对象上的所有方法支持*链式调用*。

### .cookie

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

### .data

>	以二进制形式读取或修改响应数据，使用方法同`request.data`。

### .head

>	读取或修改响应头字段，使用方法同`request.head`。

### .is

>	判断响应是否属于某种类型，使用方法同`request.is`。

### .type

>	读取或修改响应类型，使用方法同`request.type`。

### .status

>	读取或修改响应状态码。

	response
		.status(200)
		.status();  // => 200