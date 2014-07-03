if ( process.env.NEW_RELIC_ENABLED ) {
  require( "newrelic" );
}

var express = require("express");
var logfmt = require("logfmt");
var util = require("./lib/util");
var logic = require("./lib/logic");
var data = require("./lib/data");
var pollBadgekitApi = require("./lib/badgekit-poll.js");
var enforce = require('express-sslify');
var helmet = require('helmet');
var https = require('https');
var fs = require('fs');

var app = express();

var cspPolicy = {
  'default-src': ["'self'", 'https://login.persona.org'],
  'script-src': ["'self'", 'https://login.persona.org'],
};

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({
  defaultLayout: 'main'
});
handlebars.loadPartials();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(logfmt.requestLogger());
app.use(express.favicon());
app.use(enforce.HTTPS(true));
app.use(express.urlencoded());
app.use(express.cookieParser(process.env.COOKIE_SECRET));
app.use(express.session({
  secret: process.env.COOKIE_SECRET,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: true,
  },
}));
app.use(express.csrf());
app.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  res.locals.token = req.csrfToken();
  next();
});
app.use(helmet.hsts()); // HTTP Strict Transport Security
app.use(helmet.xframe('deny')); // X-Frame-Options
app.use(helmet.csp(cspPolicy));
app.use(helmet.iexss());
app.use(helmet.contentTypeOptions());
app.use(helmet.hidePoweredBy());
app.use(app.router);
app.use(express.static(__dirname + '/public'));
app.use('/bower', express.static(__dirname + '/bower_components'));

// middleware to restrict access to internal routes
function restrict(req, res, next) {
  if (req.session.authorized) {
    next();
  } else {
    req.session.targetURL = req.url;
    res.redirect('/');
  }
}

// persona
require("express-persona")(app, {
  audience: process.env.HOST + ":" + process.env.PORT, // Must match your browser's address bar
  verifyResponse: function (err, req, res, email) {
    if (util.isValidEmail(email, ["@mozillafoundation.org", "@mozilla.com"])) {
      req.session.authorized = true;
      res.json({
        status: "okay",
        email: email
      });
      return;
    } else {
      console.log("Login attempt by: ", req.session.email);
      req.session.email = null;
      req.session.authorized = null;
      res.json({
        status: "failure",
        reason: "Only users with a mozillafoundation.org or mozilla.com email address may use this tool"
      });
    }
  },
  logoutResponse: function (err, req, res) {
    if (req.session.authorized) {
      req.session.authorized = null;
    }

    res.json({
      status: "okay"
    });
  }
});

// routes
app.get('/', function (req, res) {
  if (req.session.authorized) {
    if (req.session.targetURL) {
      res.redirect(req.session.targetURL);
    } else {
      res.redirect('/log-em');
    }
  } else {
    var email = req.session.email;
    res.render('home', {
      currentUser: email,
      authorized: (req.session.authorized)
    });
  }
});

function renderLoggingPage(req, res, viewName, extraTemplateValues) {
  var email = req.session.email;
  var username = util.allBeforeTheAt(email);
  var templateValues = {
    currentUser: email,
    username: username,
    authorized: (req.session.authorized),
    pageJS: 'logem',
  };

  // if this page has extraTemplateValues, add these to the object
  if (extraTemplateValues) {
    for (var attrname in extraTemplateValues) {
      templateValues[attrname] = extraTemplateValues[attrname];
    }
  }

  // pre-populate fields via URL for repeat use
  if (req.query.team) {
    templateValues.team = util.clean(decodeURI(req.query.team));
  }
  if (req.query.type) {
    templateValues.type = util.clean(decodeURI(req.query.type));
  }
  if (req.query.description) {
    templateValues.description = util.clean(decodeURI(req.query.description));
  }
  if (req.query.date) {
    templateValues.date = util.clean(decodeURI(req.query.date));
  }

  data.recentlyLogged(email, function gotRecentlyLogged(err, results) {
    var recent = util.cleanRecentForPresentation(results);
    templateValues.recentlyLogged = recent;
    res.render(viewName, templateValues);
  });
}

app.get('/log-em', restrict, function (req, res) {
  renderLoggingPage(req, res, 'log-em', null);
});

app.get('/log-many', restrict, function (req, res) {
  renderLoggingPage(req, res, 'log-many', null);
});

app.post('/log-em', restrict, function (req, res) {
  logic.processForm(req.body, req.session.email, function processedForm(err, response) {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/log-em#logged');
  });
});

app.post('/log-many', restrict, function (req, res) {
  logic.processMany(req.body, req.session.email, function processedForm(err, saved, errors) {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    var extraTemplateValues = {
      saved: saved,
      errors: errors
    };
    renderLoggingPage(req, res, 'log-many-results', extraTemplateValues);
  });
});

app.get('/delete', restrict, function (req, res) {
  var toDelete = {
    logged_by: req.session.email,
    contributor_id: req.query.contributor_id,
    contribution_date: req.query.contribution_date,
    moz_team: req.query.moz_team,
    data_bucket: req.query.data_bucket
  };
  data.deleteItem(toDelete, function deletedItem(err, response) {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    console.log("deleted", req.session.email);
    res.redirect('/log-em#logged');
  });
});

app.get('/api/totals', function (req, res) {
  data.getSummaryContributorCounts(function gotCounts(err, result) {
    if (err) {
      console.error(err);
      return res.status(500).json({status: 'Internal Server Error'});
    }
    res.json(result);
  });
});

app.get('/api', function (req, res) {
  var team = req.query.team;
  var bucket = req.query.bucket;
  var date = util.parseAndCheckDate(req.query.date);
  var errorMessage;

  if (!date) {
    errorMessage = 'Missing parameter: "date". Must be in this format: YYYY-MM-DD.';
    return res.status(400).json({message: errorMessage});
  }

  if (!team) {
    errorMessage = 'Missing parameter: "team". E.g. mofo-webmaker, moco-engagement';
    return res.status(400).json({message: errorMessage});
  }

  if (!bucket) {
    errorMessage = 'Missing parameter: "bucket". E.g. code, content, events, training, community, testing, apis';
    return res.status(400).json({message: errorMessage});
  }

  bucket = logic.applyBucketGroupings(bucket);

  data.getContributorCounts(date, team, bucket, function gotCounts(err, result) {
    if (err) {
      console.error(err);
      return res.status(500).json({message: 'Internal Server Error'});
    }
    res.json(result);
  });
});

var port = Number(process.env.PORT || 5000);

app.configure('production', function () {
  // production uses Heroku's SSL not our local test certificates
  app.listen(port, function () {
    console.log("Listening on " + port);
  });
});

app.configure('development', function () {
  // Localhost HTTPS
  var options = {
    key: fs.readFileSync('./config/key.pem'),
    cert: fs.readFileSync('./config/cert.pem')
  };
  https.createServer(options, app).listen(port, function () {
    console.log("Express server listening on port " + port);
  });
});

if (process.env.BADGEKIT_API_POLLING_FREQUENCY_MINS) {
  setInterval(pollBadgekitApi, process.env.BADGEKIT_API_POLLING_FREQUENCY_MINS * 60 * 1000);
}
