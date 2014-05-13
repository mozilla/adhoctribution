var mysql = require('mysql');
var async = require('async');
var util = require("../lib/util.js");

var connectionOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

if (process.env.DB_SSL) {
  // SSL is used for Amazon RDS, but not necessarily for local dev
  connectionOptions.ssl = process.env.DB_SSL;
}

exports.getSummaryContributorCounts = function getSummaryContributorCounts(callback) {

  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted (err) {
    if (err) {
      console.error(err);
      callback(err);

    } else {
      /*jshint multistr: true */
      var query = 'SELECT \
              (SELECT COUNT(DISTINCT contributor_id) FROM contributions) AS total_contributors, \
              (SELECT COUNT(*) FROM contributions) AS total_contributions, \
              (SELECT COUNT(DISTINCT contributor_id) FROM contributions WHERE moz_team LIKE "moco-%") AS moco_contributors, \
              (SELECT COUNT(*) FROM contributions WHERE moz_team LIKE "moco-%") AS moco_contributions, \
              (SELECT COUNT(DISTINCT contributor_id) FROM contributions WHERE moz_team LIKE "mofo-%") AS mofo_contributors, \
              (SELECT COUNT(*) FROM contributions WHERE moz_team LIKE "mofo-%") AS mofo_contributions';
      connection.query(query, function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null, result);
      });
    }
  });
};

/**
 * Count distinct contributors for a point in time
 * @param  {Date}   date
 * @param  {String}   teamname
 * @param  {Function} callback
 * @return {JSON}
 */
exports.getContributorCounts = function getContributorCounts(date, teamname, dataBucket, callback) {
  var counts = {};

  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted (err) {

    if (err) {
      console.log(err);
      callback(null, null);
    } else {

      var queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);

      var weekPrior = new Date(queryDate);
      weekPrior.setDate(queryDate.getDate() - 7);

      var yearPrior = new Date(queryDate);
      yearPrior.setFullYear(yearPrior.getFullYear() - 1);

      // format these for query
      queryDate = util.dateToISOtring(queryDate);
      weekPrior = util.dateToISOtring(weekPrior);
      yearPrior = util.dateToISOtring(yearPrior);

      async.parallel({
          last_year: function (callback) {
            /*jshint multistr: true */
            var query = 'SELECT DISTINCT contributor_id FROM contributions WHERE \
                        contribution_date <= ? \
                        AND contribution_date > ? \
                        AND moz_team = ? \
                        AND data_bucket IN (?);';
            var values = [queryDate, yearPrior, teamname, dataBucket];
            connection.query(query, values,
              function queryComplete(err, result) {
                if (err) {
                  console.log(err);
                }
                callback(null, result);
              });
          },
          last_week: function (callback) {
            /*jshint multistr: true */
            var query = 'SELECT DISTINCT contributor_id FROM contributions WHERE \
                        contribution_date <= ? \
                        AND contribution_date > ? \
                        AND moz_team = ? \
                        AND data_bucket IN (?);';
            var values = [queryDate, weekPrior, teamname, dataBucket];
            connection.query(query, values,
              function queryComplete(err, result) {
                if (err) {
                  console.log(err);
                }
                callback(null, result);
              });
          },
          last_year_excluding_last_week: function (callback) {
            /*jshint multistr: true */
            var query = 'SELECT DISTINCT contributor_id FROM contributions WHERE \
                        contribution_date <= ? \
                        AND contribution_date > ? \
                        AND moz_team = ? \
                        AND data_bucket IN (?);';
            var values = [weekPrior, yearPrior, teamname, dataBucket];
            connection.query(query, values,
              function queryComplete(err, result) {
                if (err) {
                  console.log(err);
                }
                callback(null, result);
              }
            );
          }
        },
        function (err, results) {
          var namesYear = util.fieldToArray(results.last_year, "contributor_id");
          var namesWeek = util.fieldToArray(results.last_week, "contributor_id");
          var namesYearExWeek = util.fieldToArray(results.last_year_excluding_last_week, "contributor_id");

          counts.total_active_contributors = namesYear.length;
          counts.new_contributors_7_days = util.countInAnotInB(namesWeek, namesYearExWeek);

          connection.end();
          callback(null, counts);
        });
    }
  });
};

/**
 * Get a list of contribution activities recently logged by the user
 * @param  {String}   email
 * @param  {Function} callback
 * @return {JSON}
 */
exports.recentlyLogged = function recentlyLogged(email, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted (err) {
    if (err) {
      console.error(err);
      callback(err);

    } else {
      var query = 'SELECT * FROM contributions WHERE logged_by = ? ORDER BY logged_on ASC LIMIT 20;';
      var values = [email];
      connection.query(query, values, function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null, result);
      });
    }
  });
};

/**
 * Save an activity to the DB
 * @param  {field object}   entry
 * @param  {Function} callback
 * @return {null}
 */
exports.saveItem = function saveItem(entry, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted (err) {

    if (err) {
      console.error(err);
      callback(err);

    } else {

      // Using REPLACE INTO to avoid worrying about duplicate entries
      // There is a unique key set across all team + bucket + date + description
      connection.query('REPLACE INTO contributions SET ?', entry, function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
};

/**
 * Delete an activity from the DB
 * @param  {field object} toDelete
 * @param  {Function} callback
 * @return {null}
 */
exports.deleteItem = function saveItem(toDelete, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted (err) {

    if (err) {
      console.error(err);
      callback(err);

    } else {
      /*jshint multistr: true */
      var query = 'DELETE FROM contributions WHERE \
                    logged_by = ? AND \
                    contributor_id = ? AND \
                    contribution_date = ? AND \
                    moz_team = ? AND \
                    data_bucket = ?;';
      var values = [toDelete.logged_by,
        toDelete.contributor_id,
        toDelete.contribution_date,
        toDelete.moz_team,
        toDelete.data_bucket
      ];
      connection.query(query, values,
        function (err, result) {
          if (err) {
            console.error(err);
            callback(err);
          }
          connection.end();
          callback(null);
        });
    }
  });
};
