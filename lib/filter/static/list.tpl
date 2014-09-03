<!DOCTYPE html>
<html>
<head>
<title>Directory List</title>
<style>
body{font: 10pt monospace;}
li{line-height:160%;list-style:none;}
</style>
</head>
<body>
<strong>Index of /<%=relative%></strong>
<hr />
<ul>
<% filenames.forEach(function (filename) { %>
<li><a href="<%=encodeURI(filename)%>"><%=filename%></a></li>
<% }); %>
</ul>
</body>
</html>
