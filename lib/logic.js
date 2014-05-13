var util = require("../lib/util.js");
var data = require("../lib/data.js");
var async = require('async');

/**
 * For our dashboard we've grouped up certain types of contribution activity in 'buckets'
 * @param  {str} str
 * @return {str or array}
 */
exports.applyBucketGroupings = function applyBucketGroupings (str) {
  if (str === 'content') {
    return ['content', 'translation'];
  }
  if (str === 'community') {
    return ['community', 'partners','1to1relation'];
  }
  return str;
};

exports.processForm = function processForm(body, user_email, callback) {
  var teamname = body.teamname;
  var databucket = body.databucket;
  var description = body.description;
  var date = body.date;
  var evidence = body.evidence;
  var contributors = body.contributors;
  // split on comma, semicolon, extra white spaces and new lines
  contributors = contributors.split(/\s*[,;]\s*|\s{2,}|[\r\n]+/);
  // trim all of these
  for (var i = contributors.length - 1; i >= 0; i--) {
    contributors[i] = contributors[i].trim();
  }
  contributors = util.cleanArray(contributors);

  async.each(contributors, function (contributor, callback) {
    var entry = {
      logged_by: user_email,
      contributor_id: contributor,
      contribution_date: new Date(date),
      moz_team: teamname,
      data_bucket: databucket,
      description: description,
      evidence: evidence
    };
    data.saveItem(entry, function savedItem(err, res) {
      if (err) {
        console.error(err);
      }
      callback(null);
    });
  }, function savedAllItems(err) {
    if (err) {
      console.error(err);
    }
    callback(null);
  });

};
