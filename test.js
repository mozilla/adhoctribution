var util = require("./lib/util");
var data = require("./lib/data");

data.recentlyLogged("adam@mozillafoundation.org", function gotRecentlyLogged (err, results) {
  util.cleanRecentForPresentation(results);
  process.exit(0);
});
