var async = require('async');
var data = require("../lib/data.js");

var badgekit = require('badgekit-api-client')(
  process.env.BADGEKIT_API_URL, {
    key: process.env.BADGEKIT_API_KEY,
    secret: process.env.BADGEKIT_API_SECRET
  }
);

exports = module.exports = function pollBadgekitApi() {
  data.getContributorBadges(function (err, results) {
    if (err) {
      console.error(err);
      return;
    }

    async.each(results, function (badge, callback) {
      var context = {
        system: badge.systemSlug,
        badge: badge.badgeSlug
      };
      badgekit.getBadgeInstances(context, function (err, instances) {
        if (err) {
          return callback(err);
        }

        var latestTimestamp = null;

        async.each(instances, function (instance, innerCallback) {
          var issuedOn = new Date(instance.issuedOn);

          if (latestTimestamp === null || latestTimestamp < issuedOn) {
            latestTimestamp = issuedOn;
          }

          if (issuedOn <= badge.lastPolled) {
            // if this badge's issuedOn timestamp is earlier than the latest timestamp we've already polled, skip it, as we've already seen it
            return innerCallback();
          }

          var entry = {
            logged_by: 'badgekit-api',
            contributor_id: instance.email,
            contribution_date: issuedOn,
            moz_team: badge.moz_team,
            data_bucket: badge.data_bucket,
            description: badge.description,
            evidence: instance.assertionUrl
          };

          data.saveItem(entry, function (err, res) {
            return innerCallback(err);
          });
        },
        function (err) {
          if (err) {
            return callback(err);
          }

          if (latestTimestamp === null) {
            return callback();
          }

          data.updateBadgePollTime(badge.id, new Date(latestTimestamp), function (err) {
            return callback(err);
          });
        });
      });
    },
    function (err) {
      if (err) {
        console.error(err);
        return;
      }
    });
  });
};
