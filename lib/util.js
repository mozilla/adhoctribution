exports.endsWith = function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

exports.cleanArray = function cleanArray(toClean) {
  var newArray = [];
  for (var i = 0; i < toClean.length; i++) {
    if (toClean[i]) {
      newArray.push(toClean[i]);
    }
  }
  return newArray;
};
