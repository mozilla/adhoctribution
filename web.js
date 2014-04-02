var express = require("express");
var logfmt = require("logfmt");
var app = express();

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({
  defaultLayout: 'main'
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// static
app.use(express.static(__dirname + '/public'));

// logging
app.use(logfmt.requestLogger());

app.get('/', function (req, res) {
  res.render('home');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function () {
  console.log("Listening on " + port);
});
