/**
 * Checks if a string ends with another string
 * @param  {str} str
 * @param  {str} suffix
 * @return {boolean}
 */
exports.endsWith = function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 * Removes falsy values from an array
 * @param  {Array} toClean
 * @return {Array}
 */
exports.cleanArray = function cleanArray(toClean) {
  var newArray = [];
  for (var i = 0; i < toClean.length; i++) {
    if (toClean[i]) {
      newArray.push(toClean[i]);
    }
  }
  return newArray;
};

/**
 * Convert a JS date to string "YYYY-MM-DD"
 * @param  {Date} date
 * @return {str}
 */
exports.dateToISOtring = function dateToISOtring(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2); // 0 index
  var day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
};

/**
 * Counts occurances in Array A that are not in Array B
 * @param  {Array} arrA
 * @param  {Array} arrB
 * @return {Int}
 */
exports.countInAnotInB = function countInAnotInB(arrA, arrB) {
  var count = 0;
  for (var i = 0; i < arrA.length; i++) {
    if (arrB.indexOf(arrA[i]) === -1) {
      count++;
    }
  }
  return count;
};

/**
 * Extract named field from the object and return as an array
 * @param  {obj} obj
 * @param  {String} fieldname
 * @return {Array}
 */
exports.fieldToArray = function fieldToArray(obj, fieldname) {
  var arr = [];
  for (var i = 0; i < obj.length; i++) {
    arr.push(obj[i][fieldname]);
  }
  return arr;
};
