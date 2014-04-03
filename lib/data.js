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

var pool = mysql.createPool(connectionOptions);

/**
 * Count distinct contributors for a point in time
 * @param  {Date}   date
 * @param  {String}   teamname
 * @param  {Function} callback
 * @return {JSON}
 */
exports.getContributorCounts = function getContributorCounts(date, teamname, callback) {
  var counts = {};

  pool.getConnection(function connectionAttempted(err, connection) {

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

      // escape prior to queries
      queryDate = connection.escape(queryDate);
      weekPrior = connection.escape(weekPrior);
      yearPrior = connection.escape(yearPrior);
      var mozTeam = connection.escape(teamname);

      async.parallel({
          last_year: function (callback) {

            connection.query('SELECT DISTINCT contributor_id FROM contributions ' +
              ' WHERE contribution_date <= ' + queryDate + ' AND contribution_date > ' + yearPrior +
              ' AND mofo_team = ' + mozTeam,
              function queryComplete(err, result) {
                if (err) {
                  console.log(err);
                }
                callback(null, result);
              });
          },
          last_week: function (callback) {

            connection.query('SELECT DISTINCT contributor_id FROM contributions ' +
              ' WHERE contribution_date <= ' + queryDate + ' AND contribution_date > ' + weekPrior +
              ' AND mofo_team = ' + mozTeam,
              function queryComplete(err, result) {
                if (err) {
                  console.log(err);
                }
                callback(null, result);
              });
          },
          last_year_excluding_last_week: function (callback) {

            connection.query('SELECT DISTINCT contributor_id FROM contributions ' +
              ' WHERE contribution_date <= ' + weekPrior + ' AND contribution_date > ' + yearPrior +
              ' AND mofo_team = ' + mozTeam,
              function queryComplete(err, result) {
                if (err) {
                  console.log(err);
                }
                callback(null, result);
              });
          }
        },
        function (err, results) {
          var namesYear = util.fieldToArray(results.last_year, "contributor_id");
          var namesWeek = util.fieldToArray(results.last_week, "contributor_id");
          var namesYearExWeek = util.fieldToArray(results.last_year_excluding_last_week, "contributor_id");

          counts.total_active_contributors = namesYear.length;
          counts.new_contributors_7_days = util.countInAnotInB(namesWeek, namesYearExWeek);

          connection.release();
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
  pool.getConnection(function (err, connection) {
    if (err) {
      console.error(err);
      callback(err);

    } else {

      connection.query('SELECT * FROM contributions WHERE logged_by = ? ORDER BY logged_on DESC LIMIT 20;', email, function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.release();
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
  pool.getConnection(function (err, connection) {

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
        connection.release();
        callback(null);
      });
    }
  });
};
