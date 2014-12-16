<!DOCTYPE html>
<html>
<head>
<title>Directory List</title>
<style>
body{font: 10pt monospace;}
li{line-height:160%;list-style:none;}
hr{height:0;border:1px solid #ccc;border-width: 0 0 1px 0;}
a {color:#1686cc;}
h2 {color:#333;}
h2 em{color:#ff7519;}
</style>
</head>
<body>
<h2>Index of <em>/<%=relative%></em></h2>
<hr />
<ul>
<% filenames.forEach(function (filename) { %>
<li><a href="<%=encodeURI(filename)%>"><%=filename%></a></li>
<% }); %>
</ul>
</body>
</html>
