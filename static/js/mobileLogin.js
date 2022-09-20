// cookie.js
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'));
  } else {
    factory(jQuery);
  }
}(function ($) {
  var pluses = /\+/g;
  function encode(s) {
    return config.raw ? s : encodeURIComponent(s);
  }
  function decode(s) {
    return config.raw ? s : decodeURIComponent(s);
  }
  function stringifyCookieValue(value) {
    return encode(config.json ? JSON.stringify(value) : String(value));
  }
  function parseCookieValue(s) {
    if (s.indexOf('"') === 0) {
      s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    try {
      s = decodeURIComponent(s.replace(pluses, ' '));
      return config.json ? JSON.parse(s) : s;
    } catch (e) {}
  }
  function read(s, converter) {
    var value = config.raw ? s : parseCookieValue(s);
    return $.isFunction(converter) ? converter(value) : value;
  }
  var config = $.cookie = function (key, value, options) {
    if (arguments.length > 1 && !$.isFunction(value)) {
      options = $.extend({}, config.defaults, options);
      if (typeof options.expires === 'number') {
        var days = options.expires,
          t = options.expires = new Date();
        t.setMilliseconds(t.getMilliseconds() + days * 864e+5);
      }
      return (document.cookie = [
        encode(key), '=', stringifyCookieValue(value),
        options.expires ? '; expires=' + options.expires.toUTCString() : '',
        options.path ? '; path=' + options.path : '',
        options.domain ? '; domain=' + options.domain : '',
        '; SameSite=None; Secure'
      ].join(''));
    }
    var result = key ? undefined : {},
      cookies = document.cookie ? document.cookie.split('; ') : [],
      i = 0,
      l = cookies.length;
    for (; i < l; i++) {
      var parts = cookies[i].split('='),
        name = decode(parts.shift()),
        cookie = parts.join('=');
      if (key === name) {
        result = read(cookie, value);
        break;
      }
      if (!key && (cookie = read(cookie)) !== undefined) {
        result[name] = cookie;
      }
    }
    // cookie不存在时，获取maicontent的自定义属性
    if (!result) {
      result = $('#langId').val()
    }
    return result;
  };
  config.defaults = {};
  $.removeCookie = function (key, options) {
    $.cookie(key, '', $.extend({}, options, {
      expires: -1
    }));
    return !$.cookie(key);
  };
}));

// countdown.js
var cookieTimes = 60;
$(document).ready(function () {
  //  user
  if (typeof $.cookie('userTimeCount') === 'undefined' || typeof $.cookie('userMobile') === 'undefined' || parseInt($.cookie('userTimeCount')) === 0) {
    $('#userMobile').val('');
  } else {
    countDown('userTimeCount', '#J_user_verify');
    $('#userMobile').val($.cookie('userMobile'));
  }
  // admin
  if (typeof $.cookie('adminTimeCount') === 'undefined' || typeof $.cookie('adminMobile') === 'undefined' || parseInt($.cookie('adminTimeCount')) === 0) {
    $('#adminMobile').val('');
  } else {
    countDown('adminTimeCount', '#J_admin_verify');
    $('#adminMobile').val($.cookie('adminMobile'));
  }
});
function countDown(cookieTime, target) {
  var waitTime = parseInt($.cookie(cookieTime));
  var waitTarget = $(target);
  currentTime = parseInt((Date.parse(new Date())) / 1000);
  var timeJump = cookieTime == "userTimeCount" ? parseInt($.cookie('userTimeJump')) : parseInt($.cookie('adminTimeJump'));
  diffTime = currentTime - timeJump;
  if (!isNaN(waitTime) && waitTime > 0 && diffTime <= cookieTimes) {
    waitTime = cookieTimes - diffTime;
    waitTarget.text(waitTime + ' s').attr('disabled', 'true');
    waitTarget.addClass("verify_btn_disabled");
    $.cookie(cookieTime, waitTime, {
      path: '/'
    });
    var timer = setTimeout(function () {
      countDown(cookieTime, target);
    }, 1000);
  } else {
    waitTarget.text('获取验证码').removeAttr('disabled');
    waitTarget.removeClass("verify_btn_disabled");
    // cookieTime == "userTimeCount" ? $('#userMobile').val('') : $('#adminMobile').val('');
    clearTimeout(timer);
    return;
  }
}

// mobileLogin.js
// 接口API
var ACCOUNT_VISIBILITY = false;
var protocol = location.protocol;
if (protocol === "file:") {
  protocol = 'https:';
}
var BASE_URL = "https://corp-webmail-ssl.21cn.com/webmail/";
// 外部接口列表
var SERVER_URL = {
  "getMobileCode": BASE_URL + "login/getMobileCode.mvc",
  "loginByMobile": BASE_URL + "login/loginByMobile.mvc",
  "getAdminMobileCode": BASE_URL + "login/getAdminMobileCode.mvc",
  "loginAdminByMobile": BASE_URL + "login/loginAdminByMobile.mvc",
  // 获取登录列表信息
  "loginAjax": BASE_URL + "login/loginAjax.mvc",
  // 点击单个账号请求登录接口
  "loginIn": BASE_URL + "login/loginIn.mvc",
  "getCommonVerifyCode": BASE_URL+ 'common/getCommonVerifyCode.mvc?action=login',
  "checkCommonVerifyCode": BASE_URL + 'common/checkCommonVerifyCode.mvc'
};
var userTips = $("#J_user_mobile_tip");
var adminTips = $("#J_admin_mobile_tip");
var $passwordLoginBtn = $("#J_password_login_btn");

// 获取用户短信验证码
function getMobileCode() {
  userTips.text("");
  var _mobile = $("#userMobile").val();
  if (!mobileValidate(_mobile)) {
    if($.cookie("language") == 1) {
      _mobile.length == 0 ? userTips.text("請輸入手機號碼！") :  userTips.text("手機號碼格式錯誤！");
    } else if($.cookie("language") == 2) {
      _mobile.length == 0 ? userTips.text("Please enter your phone number!") :  userTips.text("Phone format error!");
    } else {
      _mobile.length == 0 ? userTips.text("请输入手机号码！") :  userTips.text("手机号码格式错误！");
    }
  } else {
    var _params = {
      mobile: _mobile,
      noCache: Math.random()
    };
    $.ajax({
      url: SERVER_URL.getMobileCode,
      data: _params,
      type: "POST",
      crossDomain: true == !(document.all),
      success: function (res) {
        if (res.ret == 0) {
          if($.cookie("language") == 1) {
            userTips.text("驗證碼已發送，請在手機查收").css({
              "color": "#03c03c"
            });
          } else if($.cookie("language") == 2) {
            userTips.text("Please check the sms code on your phone").css({
              "color": "#03c03c"
            });
          } else {
            userTips.text("非管理员手机号，请重新输入！").css({
              "color": "#03c03c"
            });
          }
          $.cookie('userTimeCount', cookieTimes, {
            path: '/'
          });
          $.cookie('userMobile', _mobile, {
            path: '/'
          });
          $.cookie('userTimeJump', (Date.parse(new Date())) / 1000, {
            path: '/'
          });
          countDown('userTimeCount', '#J_user_verify');
        } else {
          userTips.text(res.msg);
        }
      },
      error: function (err) {
        if($.cookie("language") == 1) {
          userTips.text("網絡請求失敗");
        } else if($.cookie("language") == 2) {
          userTips.text("Network error");
        } else {
          userTips.text("网络请求失败");
        }
      }
    });
  }
}
// 用户短信登录
function loginByMobile(e) {
  var _type = $(e.target).attr("data-type");
  userTips.text("");
  var _mobile = $("#userMobile").val();
  var _code = $("#userVerify").val();
  if (!mobileValidate(_mobile)) {
    if($.cookie("language") == 1) {
      _mobile.length == 0 ? userTips.text("請輸入手機號碼！") :  userTips.text("手機號碼格式錯誤！");
    } else if($.cookie("language") == 2) {
      _mobile.length == 0 ? userTips.text("Please enter your phone number!") :  userTips.text("Phone format error!");
    } else {
      _mobile.length == 0 ? userTips.text("请输入手机号码！") :  userTips.text("手机号码格式错误！");
    }
  } else {
    if (!codeValidate(_code)) {
      if($.cookie("language") == 1) {
        _code.length == 0 ? userTips.text("請輸入短信驗證碼！") : userTips.text("短信驗證碼格式錯誤！");
      } else if($.cookie("language") == 2) {
        _code.length == 0 ? userTips.text("Please enter sms code number!") : userTips.text("Sms code format error!");
      } else {
        _code.length == 0 ? userTips.text("请输入短信验证码！") : userTips.text("短信验证码格式错误！");
      }
    } else {
      var _params = {
        emailAccount: "",
        password: "",
        mobile: _mobile,
        code: _code,
        noCache: Math.random()
      };
      userTips.text("登录中，请稍候...").css({
        "color": "#03c03c"
      });
      fetchAccounts(_params, _type);
      // $.ajax({
      //   url: SERVER_URL.loginByMobile,
      //   data: _params,
      //   type: "POST",
      //   crossDomain: true == !(document.all),
      //   success: function (res) {
      //     if (res.ret == 0) {
      //       top.location.href = res.data.loginUrl;
      //       _uxt.push(["_trackEvent", "webmail用户手机验证码", "登录", "成功"]);
      //     } else {
      //       userTips.text(res.msg);
      //       _uxt.push(["_trackEvent", "webmail用户手机验证码", "登录", "失败"]);
      //     }
      //   },
      //   error: function (err) {
      //     if($.cookie("language") == 1) {
      //       userTips.text("網絡請求失敗");
      //     } else if($.cookie("language") == 2) {
      //       userTips.text("Network error");
      //     } else {
      //       userTips.text("网络请求失败");
      //     }
      //     _uxt.push(["_trackEvent", "webmail用户手机验证码", "登录", "失败"]);
      //   }
      // });
    }
  }
}
// 获取管理后台短信验证码
function getAdminMobileCode() {
  adminTips.text("");
  var _mobile = $("#adminMobile").val();
  if (!mobileValidate(_mobile)) {
    if($.cookie("language") == 1) {
      _mobile.length == 0 ? adminTips.text("請輸入手機號碼！") :  adminTips.text("手機號碼格式錯誤！");
    } else if($.cookie("language") == 2) {
      _mobile.length == 0 ? adminTips.text("Please enter your phone number!") :  adminTips.text("Phone format error!");
    } else {
      _mobile.length == 0 ? adminTips.text("请输入手机号码！") :  adminTips.text("手机号码格式错误！");
    }
  } else {
    var _params = {
      mobile: _mobile,
      nocache: Math.random()
    };
    $.ajax({
      url: SERVER_URL.getAdminMobileCode,
      data: _params,
      type: "POST",
      crossDomain: true == !(document.all),
      success: function (res) {
        if (res.ret == 0) {
          if($.cookie("language") == 1) {
            adminTips.text("驗證碼已發送，請在手機查收").css({
              "color": "#03c03c"
            });
          } else if($.cookie("language") == 2) {
            adminTips.text("Please check the sms code on your phone").css({
              "color": "#03c03c"
            });
          } else {
            adminTips.text("验证码已发送，请在手机查收").css({
              "color": "#03c03c"
            });
          }
          $.cookie('adminTimeCount', cookieTimes, {
            path: '/'
          });
          $.cookie('adminMobile', _mobile, {
            path: '/'
          });
          $.cookie('adminTimeJump', (Date.parse(new Date())) / 1000, {
            path: '/'
          });
          countDown('adminTimeCount', '#J_admin_verify');
        } else {
          adminTips.text(res.msg);
        }
      },
      error: function (err) {
        if($.cookie("language") == 1) {
          adminTips.text("網絡請求失敗");
        } else if($.cookie("language") == 2) {
          adminTips.text("Network error");
        } else {
          adminTips.text("网络请求失败");
        }
      }
    });
  }
}
// 管理员短信登录
function loginAdminByMobile() {
  adminTips.text("");
  var _mobile = $("#adminMobile").val();
  var _code = $("#adminVerify").val();
  if (!mobileValidate(_mobile)) {
    if($.cookie("language") == 1) {
      _mobile.length == 0 ? adminTips.text("請輸入手機號碼！") :  adminTips.text("手機號碼格式錯誤！");
    } else if($.cookie("language") == 2) {
      _mobile.length == 0 ? adminTips.text("Please enter your phone number!") :  adminTips.text("Phone format error!");
    } else {
      _mobile.length == 0 ? adminTips.text("请输入手机号码！") :  adminTips.text("手机号码格式错误！");
    }
  } else {
    if (!codeValidate(_code)) {
      if($.cookie("language") == 1) {
        _code.length == 0 ? adminTips.text("請輸入短信驗證碼！") : adminTips.text("短信驗證碼格式錯誤！");
      } else if($.cookie("language") == 2) {
        _code.length == 0 ? adminTips.text("Please enter sms code number!") : adminTips.text("Sms code format error!");
      } else {
        _code.length == 0 ? adminTips.text("请输入短信验证码！") : adminTips.text("短信验证码格式错误！");
      }
    } else {
      var _params = {
        mobile: _mobile,
        code: _code,
        noCache: Math.random()
      }
      $.ajax({
        url: SERVER_URL.loginAdminByMobile,
        data: _params,
        type: "POST",
        crossDomain: true == !(document.all),
        success: function (res) {
          if (res.ret == 0) {
            top.location.href = res.data.loginUrl;
            _uxt.push(["_trackEvent", "webmail管理员手机验证码", "登录", "成功"]);
          } else {
            adminTips.text(res.msg);
            _uxt.push(["_trackEvent", "webmail管理员手机验证码", "登录", "失败"]);
          }
        },
        error: function (err) {
          if($.cookie("language") == 1) {
            adminTips.text("網絡請求失敗");
          } else if($.cookie("language") == 2) {
            adminTips.text("Network error");
          } else {
            adminTips.text("网络请求失败");
          }
          _uxt.push(["_trackEvent", "webmail管理员手机验证码", "登录", "失败"]);
        }
      });
    }
  }
}
// 手机号码格式校验
function mobileValidate(mobile) {
  var reg = /^((13|14|15|17|18)+[0-9]{9})|((166|198|199|191)+[0-9]{8})$/;
  if (reg.exec(mobile)) {
    return true;
  }
  return false;
}
// 短信验证验证码校验
function codeValidate(code) {
  if (/^\d{6}$/.test(code)) {
    return true;
  }
  return false;
}
$("#J_user_verify").on("click", getMobileCode);
$("#J_user_mobile_login").on("click", loginByMobile);
$("#J_admin_verify").on("click", getAdminMobileCode);
$("#J_admin_mobile_login").on("click", loginAdminByMobile);
$passwordLoginBtn.on("click", loginByPassword);


/* ################################################################## */
// 用户账户登录相关逻辑
/* ################################################################## */
var $user_login_normal = $(".user_login_normal"),
  $user_login_mobile = $(".user_login_mobile"),
  $admin_login_normal = $(".admin_login_normal"),
  $admin_login_mobile = $(".admin_login_mobile"),
  $user_normal_btn = $(".J_user_normal"),
  $user_mobile_btn = $(".J_user_mobile"),
  $admin_normal_btn = $(".J_admin_normal"),
  $admin_mobile_btn = $(".J_admin_mobile"),
  $switch_to_user_btn = $(".J_switch_to_user"),
  $switch_to_admin_btn = $(".J_switch_to_admin");
  $userBox = $("#userBox"),
  $adminBox = $("#adminBox"),
  $accountsBox = $("#accountsBox"),
  $passwordLogin = $(".user_login_normal"),
  $mobileLogin = $(".user_login_mobile"),
  $accountsBack = $(".J_accounts_back");
  $securityBox = $("#securityBox")
$user_normal_btn.on("click", function () {
  $user_login_mobile.hide();
  $user_login_normal.show();
});
$user_mobile_btn.on("click", function () {
  $user_login_normal.hide();
  $user_login_mobile.show();
});
$admin_normal_btn.on("click", function () {
  $admin_login_mobile.hide();
  $admin_login_normal.show();
});
$admin_mobile_btn.on("click", function () {
  $admin_login_normal.hide();
  $admin_login_mobile.show();
});
$switch_to_admin_btn.on("click", switchToAdmin);
$switch_to_user_btn.on("click", switchToUser);
// 切换到管理员登录
function switchToAdmin() {
  $userBox.hide();
  $adminBox.show();
  $user_login_normal.hide();
  $user_login_mobile.hide();
  $admin_login_mobile.hide();
  $admin_login_normal.show();
}
// 切换到用户登录
function switchToUser() {
  $userBox.show();
  $adminBox.hide();
  $user_login_mobile.hide();
  $admin_login_mobile.hide();
  $admin_login_normal.hide();
  $user_login_normal.show();
}
// 获取URL参数
function getUrlParam(key) {
  var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}
// 暂时屏蔽
// $(function () {
//     var _target = getUrlParam("target");
//     switch (_target) {
//         case "user":
//             switchToUser();
//             break;
//         case "admin":
//             switchToAdmin();
//             break;
//         default:
//             switchToUser();
//             break;
//     }
// });

// 从登录框到账户框
function loginToAccounts(type) {
  $userBox.hide();
  $accountsBox.show();
  ACCOUNT_VISIBILITY = true;
  var _language = $.cookie("language") || 0;
  if(_language == 0) {
    switch(type) {
      case "password":
        $(".accounts_box .box_content .box_header .title").text("请选择要登录的身份");
        $(".accounts_box .box_content .box_header .back").text("返回");
      break;
      case "mobile":
        $(".accounts_box .box_content .box_header .title").text("请选择要登录的账号");
        $(".accounts_box .box_content .box_header .back").text("返回");
      break;
      default:
      break;
    }
  } else if(_language == 1) {
    switch(type) {
      case "password":
        $(".accounts_box .box_content .box_header .title").text("請選擇要登錄的身份");
        $(".accounts_box .box_content .box_header .back").text("返回");
      break;
      case "mobile":
        $(".accounts_box .box_content .box_header .title").text("請選擇要登錄的賬號");
        $(".accounts_box .box_content .box_header .back").text("返回");
      break;
      default:
      break;
    }
  } else if(_language == 2) {
    switch(type) {
      case "password":
        $(".accounts_box .box_content .box_header .title").text("Select the identity");
        $(".accounts_box .box_content .box_header .back").text("Back");
      break;
      case "mobile":
        $(".accounts_box .box_content .box_header .title").text("Select the account");
        $(".accounts_box .box_content .box_header .back").text("Back");
      break;
      default:
      break;
    }
  }
}

// 账户框返回登录框
function accountsToLogin(type) {
  var userTips = (type == "password") ?  $("#tips1") : $("#J_user_mobile_tip");
  $accountsBack.on("click", function() {
    $accountsBox.hide();
    $userBox.show();
    $securityBox.hide()
    ACCOUNT_VISIBILITY = false;
    switch (type) {
      case "password":
        $mobileLogin.hide();
        $passwordLogin.show();
        userTips.text("");
        break;
      case "mobile":
        $passwordLogin.hide();
        $mobileLogin.show();
        userTips.text("");
        break;
    }
  });
}

// 获取登录列表信息
function fetchAccounts(params, type) {
  var userTips = (type == "password") ?  $("#tips1") : $("#J_user_mobile_tip");
  var _params = {
    emailAccount: params.emailAccount,
    password: params.password,
    mobile: params.mobile,
    code: params.code,
    noCache: Math.random
  }
  $.ajax({
    url: SERVER_URL.loginAjax,
    type: "POST",
    data: _params,
    crossDomain: true == !(document.all),
    success: function(res) {
      if(res.ret == 0) {
        userTips.text("登录验证成功").css({
          "color": "#03c03c"
        });
        // 数据处理
        res.data.userList =  (res.data.userList == null || res.data.userList == "" ) ? [] : res.data.userList;
        var accountsArr = (res.data.adminList!==null && res.data.adminList!=="") ?  (res.data.userList.concat(res.data.adminList)) : (res.data.userList);
        for(var i=0, len=accountsArr.length; i < len; i++) {
          accountsArr[i].mobile = _params.mobile;
        }
        // 如果只有一个账户，直接登录
        if(accountsArr.length == 1) {
          var _language = $.cookie("language") || 0;
          var __params = {
            emailAccount: accountsArr[0].emailAccount,
            loginType: accountsArr[0].loginType,
            mobile: accountsArr[0].mobile,
            verifyKey: accountsArr[0].verifyKey,
            noCache: Math.random()
          };
          // 将参数处理为URL字符串形式
          var urlStr = "?emailAccount=" + __params.emailAccount + "&loginType=" + __params.loginType + "&mobile=" + __params.mobile + "&verifyKey=" + __params.verifyKey + "&language=" + _language + "&noCache=" + __params.noCache;
          top.location.href = SERVER_URL.loginIn + urlStr;
        } else {
          // 如果有多个账户，显示账户列表
          // 跳转到账户列表页
          loginToAccounts(type);
          // 账户列表返回按钮绑定返回事件
          accountsToLogin(type);
          // 动态创建账户列表
          createAccountsDom(accountsArr);
        }
      } else if (res.ret == 10104) {
        $('.codeVal').val('')
        $('.securityTips').text("");
        $securityBox.show()
        $userBox.hide();
        // 账户列表返回按钮绑定返回事件
        accountsToLogin(type);
        // 验证码链接
        sidId = res.msg
        $('#safecode').attr('src', SERVER_URL.getCommonVerifyCode + '&sid=' + sidId + '&t=' + Math.random())
      } else {
        userTips.text(res.msg).css({
          color: "red"
        });
      }
    },
    error: function(err) {
      userTips.text("网络连接失败").css({
        color: "red"
      });
    }
  })
}
// 变更安全验证码
$('#changeSafecode').on('click', function(e){
  $('#safecode').attr('src', SERVER_URL.getCommonVerifyCode + '&sid=' + sidId + '&t=' + Math.random())
})
// 校验眼圈验证码
$('#confirm').on('click', function(e){
  var value = $('.codeVal').val()
  if(value.length != 4) {
      $('.securityTips').text("您输入的验证码不正确！").css({
        "color": "red"
      });
      return false
  }
  $.ajax( {
      type : "POST",
      url : SERVER_URL.checkCommonVerifyCode,
      data : "sid=" + sidId + "&code=" + value + "&t=" + Math.random() + '&action=login',
      dataType : 'json',
      async:false,
      success : function(result) {      	
          if(result.ret == 0){
              $('.securityTips').text("验证成功").css({
                "color": "#03c03c"
              });
              $accountsBack.trigger('click')
          }else{
            $('.securityTips').text("您输入的验证码不正确！").css({
              "color": "red"
            });
          }
      }
  });
})
// 动态创建账号列表
function createAccountsDom(arr) {
  var htmlDOM = "";
  var accounts = arr;
  var _language = $.cookie("language") || 0;
  for(var i=0, len=accounts.length; i< len; i++) {
    var _accountInfo = JSON.stringify(accounts[i]);
    var _account_type = "";
    if(_language == 0) {
      _account_type = accounts[i].adminType == 0 ? "成员": "管理员";
    } else if(_language == 1) {
      _account_type = accounts[i].adminType == 0 ? "成員": "管理員";
    } else if(_language == 2) {
      _account_type = accounts[i].adminType == 0 ? "member": "admin";
    }
    var _account_icon = accounts[i].adminType == 0 ? "icon_user" : "icon_admin";
    var _account_email = accounts[i].emailAccount;
    var account = "<li class='account' data-info='"+_accountInfo+"'>" +
      "<div class='_left'>" +
          "<i class='account_icon "+_account_icon+"'></i>" +
      "</div>" +
     " <div class='_middle'>" +
          "<p class='account_type'>" + _account_type +"</p>" +
          "<p class='account_mail'>" + _account_email + "</p>" +
      "</div>" +
     " <div class='_right'>" +
          "<i class='arrow_right'></i>" +
      "</div>" +
    "</li>";
    htmlDOM += account;
  }
  var $accountContainer = $("#accountContainer");
  $accountContainer.html(htmlDOM);
  $(".account").on("click", handleAccountClick);
}

// 单个邮箱账号点击事件
function handleAccountClick(e) {
  var $target = $(e.target);
  if(!$target.hasClass("account")) {
    $target = $target.parents(".account");
  }
  var _accountInfo = JSON.parse($target.attr("data-info"));
  // 点击登录进入邮箱
  var _params = {
    emailAccount: _accountInfo.emailAccount,
    loginType: _accountInfo.loginType,
    mobile: _accountInfo.mobile,
    verifyKey: _accountInfo.verifyKey,
    noCache: Math.random()
  };
  // 获取当前设置语言
  var _language = $.cookie("language") || 0;
  // 将参数处理为URL字符串形式
  var urlStr = "?emailAccount=" + _params.emailAccount + "&loginType=" + _params.loginType + "&mobile=" + _params.mobile + "&verifyKey=" + _params.verifyKey + "&language=" + _language + "&noCache=" + _params.noCache;
  top.location.href = SERVER_URL.loginIn + urlStr;
  _uxt.push(["_trackEvent", "webmail-登录-账户列表", "点击，选择某一账户登录", "成功"]);
}

// 监听语言切换事件，返回到登录框
function languageChange() {
  if (ACCOUNT_VISIBILITY == true) {
    var userTips = $("#tips1");
    $accountsBox.hide();
    $userBox.show();
    $mobileLogin.hide();
    $passwordLogin.show();
    userTips.text("");
    ACCOUNT_VISIBILITY = false;
  }
}
$("#langSet ul li a").on("click", languageChange);
