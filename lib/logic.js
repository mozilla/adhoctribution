var util = require("../lib/util.js");
var data = require("../lib/data.js");
var async = require('async');

/**
 * For our dashboard we've grouped up certain types of contribution activity in 'buckets'
 * @param  {str} str
 * @return {str or array}
 */
exports.applyBucketGroupings = function applyBucketGroupings(str) {
  if (str === 'content') {
    return ['content', 'translation'];
  }
  if (str === 'community') {
    return ['community', 'partners', '1to1relation'];
  }
  return str;
};

/**
 * Process data submitted through the standard form at /log-em
 */
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
        return callback(err);
      }
      callback(null);
    });
  }, function savedAllItems(err) {
    if (err) {
      console.error(err);
      return callback(err);
    }
    callback(null);
  });

};

/**
 * Process data submitted through the bulk form at /log-many
 */
exports.processMany = function processMany(body, user_email, callback) {
  var teamname = body.teamname;
  var databucket = body.databucket;
  var evidence = body.evidence;
  var contributors = body.contributors;

  // remove straight quote marks
  contributors = util.removeQuotes(contributors);

  // split each row to process them individually
  var rows = contributors.split(/[\n\r]/g);
  var validToSave = [];
  var hasErrors = [];

  for (var i = rows.length - 1; i >= 0; i--) {
    var row = rows[i].split(',');

    if (!row[0]) {
      // empty lines or array items introduced by the split
      continue;
    }

    // there should only be three values per line
    if (row.length !== 3) {
      hasErrors.push(row);
      continue;
    }

    // trim the strings
    row = util.trimArrayValues(row);

    // the first value should be an email address
    if (row[0].indexOf("@") === -1) {
      hasErrors.push(row);
      continue;
    }

    // the second value shoud be a date
    var d = util.parseAndCheckDate(row[1]);
    if (!d) {
      hasErrors.push(row);
      continue;
    }

    // Format this exactly as needed
    row[1] = util.dateToISOtring(d);

    // this is valid
    validToSave.push({
      contributor_id: row[0],
      contribution_date: row[1],
      description: row[2]
    });
  }

  async.eachLimit(validToSave, 4, function (contribution, callback) {
    var entry = {
      logged_by: user_email,
      contributor_id: contribution.contributor_id,
      contribution_date: new Date(contribution.contribution_date),
      moz_team: teamname,
      data_bucket: databucket,
      description: contribution.description,
      evidence: evidence
    };
    data.saveItem(entry, function savedItem(err, res) {
      if (err) {
        console.log(entry);
        console.error(err);
        return callback(err);
      }
      callback(null);
    });
  }, function savedAllItems(err) {
    if (err) {
      console.error(err);
      return callback(err);
    }
    callback(null, validToSave, hasErrors);
  });

};
