$(document).ready(function () {
  // show a dialog to new users, or those who haven't been here for a while
  if (!$.cookie('welcomed')) {
    $('#welcomeModal').modal();
  }
  // set a cookie on login, so we don't show the welcome message everytime
  $.cookie('welcomed', true, {
    expires: 30
  });
});

$("#showWelcome").click(function () {
  $('#welcomeModal').modal();
});
