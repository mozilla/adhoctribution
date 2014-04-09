/**
 * Checks if a string ends with another string
 * @param  {str} str
 * @param  {str} suffix
 * @return {boolean}
 */
function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/**
 * Removes falsy values from an array
 * @param  {Array} toClean
 * @return {Array}
 */
function cleanArray(toClean) {
  var newArray = [];
  for (var i = 0; i < toClean.length; i++) {
    if (toClean[i]) {
      newArray.push(toClean[i]);
    }
  }
  return newArray;
}

/**
 * Convert a JS date to string "YYYY-MM-DD"
 * @param  {Date} date
 * @return {str}
 */
function dateToISOtring(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2); // 0 index
  var day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

/**
 * Counts occurances in Array A that are not in Array B
 * @param  {Array} arrA
 * @param  {Array} arrB
 * @return {Int}
 */
function countInAnotInB(arrA, arrB) {
  var count = 0;
  for (var i = 0; i < arrA.length; i++) {
    if (arrB.indexOf(arrA[i]) === -1) {
      count++;
    }
  }
  return count;
}

/**
 * Extract named field from the object and return as an array
 * @param  {obj} obj
 * @param  {String} fieldname
 * @return {Array}
 */
function fieldToArray(obj, fieldname) {
  var arr = [];
  for (var i = 0; i < obj.length; i++) {
    arr.push(obj[i][fieldname]);
  }
  return arr;
}

/**
 * Tidy up some data before display, as this is more readable the handlebars logic
 * @param  {Array} originalList
 * @return {Array}
 */
function cleanRecentForPresentation(originalList) {
  var cleanedList = [];
  var obj;
  for (var i = originalList.length - 1; i >= 0; i--) {
    obj = {};
    obj.logged_on = dateToISOtring(originalList[i].logged_on);
    obj.contributor_id = originalList[i].contributor_id;
    obj.contribution_date = dateToISOtring(originalList[i].contribution_date);
    obj.mofo_team = originalList[i].mofo_team;
    obj.data_bucket = originalList[i].data_bucket;
    obj.description = originalList[i].description;
    cleanedList.push(obj);
  }
  return cleanedList;
}

/**
 * Remove angle brackets
 * @param  {String} s
 * @return {String}
 */
function removeAngleBrackets(s) {
  var clean = s.replace(/</g, '');
  clean = clean.replace(/>/g, '');
  return clean;
}

/**
 * Very minimal cleaning
 * @param  {String} s
 * @return {String}
 */
function clean(s) {
  s = removeAngleBrackets(s);
  return s;
}

module.exports = {
  dateToISOtring: dateToISOtring,
  cleanRecentForPresentation: cleanRecentForPresentation,
  fieldToArray: fieldToArray,
  countInAnotInB: countInAnotInB,
  cleanArray: cleanArray,
  endsWith: endsWith,
  clean: clean
};
