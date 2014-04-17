var login = document.querySelector("#login");
if (login) {
  login.addEventListener("click", function () {
    navigator.id.request({
      siteName: "Ad hoc contribution logger"
    });
  }, false);
}

var logout = document.querySelector("#logout");
if (logout) {
  logout.addEventListener("click", function () {
    navigator.id.logout();
  }, false);
}

var token = $("meta[name='csrf-token']").attr("content");
var currentUser = $("meta[name='persona-email']").attr("content");
if (!currentUser) {
  currentUser = null; // specifically set to null to avoid persona looping on logout
}

navigator.id.watch({
  loggedInUser: currentUser,
  onlogin: function (assertion) {
    $.ajax({
      type: 'POST',
      url: '/persona/verify',
      data: {
        assertion: assertion,
        _csrf: token
      },
      success: function (res, status, xhr) {
        if (res.status === 'okay') {
          window.location.reload();
        } else {
          window.alert(res.reason);
        }
      },
      error: function (xhr, status, err) {
        navigator.id.logout();
        window.alert("Login failure: " + err);
      }
    });
  },
  onlogout: function () {
    $.ajax({
      type: 'POST',
      url: '/persona/logout',
      data: {
        _csrf: token
      },
      success: function (res, status, xhr) {
        window.location.reload();
      },
      error: function (xhr, status, err) {
        window.alert("Logout failure: " + err);
      }
    });
  }
});

// pre-fill quick link

var type = $("#hiddenType").val();
var team = $("#hiddenTeam").val();

if (type) {
  var textToFindType = type;
  textToFindType = decodeURI(textToFindType);
  var elType = document.getElementById('databucket');
  for (var i = 0; i < elType.options.length; i++) {
      if (elType.options[i].text === textToFindType) {
          elType.selectedIndex = i;
          break;
      }
  }
}

if (team) {
  var textToFindTeam = team;
  textToFindTeam = decodeURI(textToFindTeam);
  var elTeam = document.getElementById('teamname');
  for (var i = 0; i < elTeam.options.length; i++) {
      if (elTeam.options[i].text === textToFindTeam) {
          elTeam.selectedIndex = i;
          break;
      }
  }
}

$(".deleteLink").click(function (event) {
  if (!confirm("Are you sure?")) {
    event.preventDefault();
  }
});

// Validation
$.validator.addMethod("valueNotEquals", function (value, element, arg) {
  return arg !== value;
}, "Value must not equal arg.");

$.validator.addMethod("date", function (date, element) {
  return this.optional(element) || date.match(/^\d{4}-((0\d)|(1[012]))-(([012]\d)|3[01])$/);
}, "Date as YYYY-MM-DD");

$("#contributionForm").validate({
  rules: {
    "date": {
      date: true
    },
    "description": {
      minlength: 5
    },
    "teamname": {
      valueNotEquals: "default"
    },
    "databucket": {
      valueNotEquals: "default"
    }
  },
  messages: {
    "teamname": {
      valueNotEquals: "Which team is this for?"
    },
    "databucket": {
      valueNotEquals: "Please select a bucket"
    }
  }
});

// Helpers
function dateToISOString(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2); // 0 index
  var day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

$("#btnToday").click(function (event) {
  event.preventDefault();
  var today = new Date();
  var s = dateToISOString(today);
  $("#date").val(s);
});

// quick link
$("#btnQuicklink").click(function (event) {
  event.preventDefault();
  var team = encodeURI($("#teamname").val());
  var type = encodeURI($("#databucket").val());
  var description = encodeURI($("#description").val());
  var date = encodeURI($("#date").val());
  var quickLink = location.protocol + '//' + location.hostname + '/log-em?team=' + team + '&type=' + type + '&description=' + description + '&date=' + date;
  $('#linkToCopy').val(quickLink);
  $('#linkModal').modal();
});

$("#linkToCopy").on("click", function () {
  $(this).select();
});

// Tooltop
$('.tooltipActive').tooltip();

// Datepicker
$('.datePickerActive').datepicker({
  format: "yyyy-mm-dd",
  autoclose: true,
  todayHighlight: true
});

// remember a users team for convenience
$("#teamname").change(function () {
  $.cookie('team', $(this).val(), {
    expires: 30
  });
});

$(document).ready(function () {
  if ($.cookie('team')) {
    if ($("#teamname").val() === "default") {
      $("#teamname").val($.cookie('team'));
    }
  }
});
