var mysql = require('mysql');

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
 * Save item
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
