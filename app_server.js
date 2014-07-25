var express = require('express');
var ejs = require('ejs');
var app = express();

app.use(express.static(__dirname+'/public'));

app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');

app.get('/', function(request, response) { 
  response.render('index')
});
app.get('/:name', function(request, response) { 
  response.render('index')
});

app.listen(5000);

