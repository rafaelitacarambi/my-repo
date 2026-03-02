(function ($) {
  var expiredPasswordToken, encryptedEmail;

  function showForgotPassword() {
    hideAllContents();
    hideAllMessagesForgotPasswordContent();
    hideLoadingForgotButton();

    setMessageHeader("Recuperar senha");

    $("#forgotPasswordEmail").val("");
    $("#forgotPasswordContent").show();
    setTimeout(function () {
      $("#forgotPasswordEmail").focus();
    }, 1);
  }

  function showLoginForm(email) {
    hideAllContents();
    hideAllMessagesLoginContent();
    hideLoadingLoginButton();

    setMessageHeader("");
    $("#email").val(email || "");
    $("#password").val("");
    setTimeout(function () {
      $("#email").focus();
    }, 1);

    $("#loginContent").show();

    const href = window.location.href.split("=", 1)[0];
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const provider = urlParams.get("provider");
    $(".submitButton").removeClass("disabled");
    setTimeout(() => {
      window.location.href = `${href}=${provider}`;
    }, 50);
  }

  function showCreatePassword() {
    hideAllContents();
    hideAllMessagesCreatePasswordContent();
    hideLoadingChangeOrCreatePasswordButton();

    setMessageHeader("Cadastrar Senha");

    $("#createPassword").attr("placeholder", "Senha");
    setTimeout(function () {
      $("#createPassword").focus();
    }, 1);

    $("#createPasswordConfirm").attr("placeholder", "Confirmação de senha");

    $("#createPasswordContent").show();
  }

  function showChangePassword(messageHeader, createPasswordButtonMessage) {
    hideAllContents();
    hideAllMessagesCreatePasswordContent();
    hideLoadingChangeOrCreatePasswordButton();

    if (messageHeader) {
      setMessageHeader(messageHeader);
      $("#msgHeader").css("font-size", "x-large");
    } else {
      setMessageHeader("Alterar Senha");
    }

    $("#createPassword").attr("placeholder", "Nova senha");
    setTimeout(function () {
      $("#createPassword").focus();
    }, 1);

    $("#createPasswordConfirm").attr(
      "placeholder",
      "Confirmação de nova senha"
    );

    if (createPasswordButtonMessage) {
      $("#createPasswordButton").html(createPasswordButtonMessage);
    }

    $("#createPasswordContent").show();
  }

  function setMessageHeader(message) {
    $("#msgHeader").text(message);
  }

  function showUserAlreadyExists() {
    hideAllContents();
    setMessageHeader("");
    $("#userAlreadyExistsContent").show();
  }

  function hideAllMessagesLoginContent() {
    $("#successMessage").hide();
    $("#errorMessage").hide();
  }

  function hideAllMessagesForgotPasswordContent() {
    $("#forgotErrorMessage").hide();
    $("#forgotSuccessMessage").hide();
  }

  function hideAllMessagesCreatePasswordContent() {
    $("#createpasswordSuccessMessage").hide();
    $("#createPasswordErrorMessage").hide();
  }

  function showLoadingLoginButton() {
    $(".submitButton").html(
      '<i class="fa fa-spinner fa-spin"></i> Autenticando...'
    );
    $(".submitButton").attr("disabled", "disabled");
  }

  function showLoadingForgotButton() {
    $("#forgotPasswordButton").html(
      '<i class="fa fa-spinner fa-spin"></i> Recuperando senha...'
    );
    $("#forgotPasswordButton").attr("disabled", "disabled");
  }

  function showLoadingCreatePasswordButton() {
    $("#createPasswordButton").html(
      '<i class="fa fa-spinner fa-spin"></i> Salvando senha...'
    );
    $("#createPasswordButton").attr("disabled", "disabled");
  }

  function showLoadingChangePasswordButton() {
    $("#createPasswordButton").html(
      '<i class="fa fa-spinner fa-spin"></i> Alterando senha...'
    );
    $("#createPasswordButton").attr("disabled", "disabled");
  }

  function showLoggingInOnPasswordCreateOrChange(message) {
    $("#createPasswordErrorMessage").hide();
    $("#createpasswordSuccessMessage").show();
    $("#createpasswordSuccessMessage").html(
      '<i class="fa fa-spinner fa-spin" style="color: #5cb85c !important"></i> ' +
        message
    );
    $("#createpasswordSuccessMessage").fadeIn();
  }

  function showSuccessMessageCreatePassword(message) {
    $("#createPasswordErrorMessage").hide();
    $("#createpasswordSuccessMessage").show();
    $("#createpasswordSuccessMessage").html(
      '<i class="fa fa-check"></i>' + message
    );
    $("#createpasswordSuccessMessage").fadeIn();
  }

  function showErrorMessageCreatePassword(message) {
    $("#createpasswordSuccessMessage").hide();
    $("#createPasswordErrorMessage").html(
      '<i class="fa fa-close"></i>' + message
    );
    $("#createPasswordErrorMessage").show();
    $("#createPasswordErrorMessage").fadeIn();

    hideLoadingChangeOrCreatePasswordButton();
  }

  function showErrorMessage(message) {
    $("#errorMessage").html('<i class="fa fa-close"></i>' + message);
    $("#errorMessage").fadeIn();
    $("#successMessage").hide();

    hideLoadingLoginButton();
  }

  function showForgotErrorMessage(message) {
    $("#forgotErrorMessage").html('<i class="fa fa-close"></i>' + message);
    $("#forgotErrorMessage").fadeIn();
    $("#forgotSuccessMessage").hide();

    hideLoadingForgotButton();
  }

  function clearPasswordFields() {
    $("#createPassword").val("");
    $("#createPasswordConfirm").val("");
  }

  function showChangeOrCreatePasswordErrorMessage(message) {
    $("#createPasswordErrorMessage").html(
      '<i class="fa fa-close"></i>' + message
    );
    $("#createPasswordErrorMessage").fadeIn();
    $("#createpasswordSuccessMessage").hide();

    hideLoadingChangeOrCreatePasswordButton();
  }

  function showSuccessMessage(message) {
    $("#successMessage").html('<i class="fa fa-check"></i>' + message);
    $("#successMessage").fadeIn();
    $("#errorMessage").hide();
  }

  function hideLoadingLoginButton() {
    $(".submitButton").html("Entrar");
    $(".submitButton").removeAttr("disabled");
  }

  function hideLoadingForgotButton() {
    $("#forgotPasswordButton").html("Recuperar minha senha");
    $("#forgotPasswordButton").removeAttr("disabled");
  }

  function hideLoadingChangeOrCreatePasswordButton() {
    var newpassword = getURLParameter("np");
    //var changepassword = getURLParameter("cp");

    if (newpassword != null)
      $("#createPasswordButton").html("Cadastrar nova senha");
    else $("#createPasswordButton").html("Alterar minha senha");

    $("#createPasswordButton").removeAttr("disabled");
  }

  function hideAllContents() {
    $("#loginContent").hide();
    $("#createPasswordContent").hide();
    $("#userAlreadyExistsContent").hide();
    $("#forgotPasswordContent").hide();
  }

  function loginGaiaAdm(result) {
    $("#gadmEmail").val($("#email").val());
    $("#gadmPassword").val($("#password").val());
    $("#gadmLicenca").val(result.License);
    $("#gaiaAdmForm").submit();
  }

  function getURLParameter(name) {
    return (
      decodeURIComponent(
        (new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(
          location.search
        ) || [, ""])[1].replace(/\+/g, "%20")
      ) || null
    );
  }

  function LoginCheck() {
    try {
      var postData = {
        email: getURLParameter("email"),
        provider: _provider,
        token: getURLParameter("token"),
        ipOrigin: localStorage.getItem('currentIP'),
      };

      $.ajax({
        type: "POST",
        url: "/Handlers/LoginCheck.ashx",
        data: JSON.stringify(postData),

        contentType: "application/json",
        dataType: "json",
        success: function (result) {
          if (result) showUserAlreadyExists();
          else showCreatePassword();
        },
        error: function (xhr) {
          var loginResult = xhr.responseJSON;
          var message = loginResult.Message;
          showCreatePassword();
          showChangeOrCreatePasswordErrorMessage(message);
        },
      });
    } catch (e) {
      showCreatePassword();
      showChangeOrCreatePasswordErrorMessage(e);
    }
  }

  function RemoveInvalidConfirmation() {
    var createPasswordButton = $("#createPasswordButton");

    $("#createPassword").focusout(function () {
      createPasswordButton.removeAttr("disabled");
      createPasswordButton.removeClass("disabled");
      hideAllMessagesCreatePasswordContent();
    });

    $("#createPasswordConfirm").focusout(function () {
      createPasswordButton.removeAttr("disabled");
      createPasswordButton.removeClass("disabled");
      hideAllMessagesCreatePasswordContent();
    });
  }

  function InvalidConfirmation() {
    var inputConfirmPass = $("#createPasswordConfirm");
    var inputNewPass = $("#createPassword");
    var createPasswordButton = $("#createPasswordButton");

    if (inputConfirmPass.val() == "" && inputNewPass.val() != "") return false;

    if (inputConfirmPass.val() != inputNewPass.val()) {
      hideLoadingChangeOrCreatePasswordButton();
      createPasswordButton.attr("disabled", "disabled");
      createPasswordButton.addClass("disabled");
      showErrorMessageCreatePassword("Senhas não conferem.");
      return true;
    } else {
      createPasswordButton.removeAttr("disabled");
      createPasswordButton.removeClass("disabled");
      hideAllMessagesCreatePasswordContent();
      return false;
    }
  }

  function SetChangePasswordSubmit() {
    $("#createPasswordForm").on("click", function (event) {
      if (InvalidConfirmation()) {
        event.preventDefault();
        return false;
      }
      return true;
    });

    $("#createPasswordForm").submit(function () {
      hideAllMessagesCreatePasswordContent();

      var isValid = $(this).valid();

      var hasError = $("#createPasswordErrorMessage").css("display") == "block";

      if (isValid && !hasError) {
        showLoadingChangePasswordButton();

        var postData = {
          email: encryptedEmail || getURLParameter("email"),
          newPassword: $("#createPassword").val(),
          confirmPassword: $("#createPasswordConfirm").val(),
          provider: _provider,
          token: expiredPasswordToken || getURLParameter("token"),
        };

        $.ajax({
          type: "POST",
          url: "/Handlers/ChangeMyPassword.ashx",
          data: JSON.stringify(postData),
          success: function (result) {
            RedirectToLogin(result.Email);
          },
          error: function (xhr) {
            var result = xhr.responseJSON;
            clearPasswordFields();
            showChangeOrCreatePasswordErrorMessage(result.Message);
          },
          contentType: "application/json",
          dataType: "json",
        });
      }
      return false;
    });
  }

  function RedirectToLogin(email) {
    showLoginForm(email);
  }

  function SetCreatePasswordSubmit() {
    $("#createPasswordForm").on("click", function (event) {
      if (InvalidConfirmation()) {
        event.preventDefault();
        return false;
      }
      return true;
    });

    $("#createPasswordForm").submit(function () {
      hideAllMessagesCreatePasswordContent();

      var isValid = $(this).valid();

      var hasError = $("#createPasswordErrorMessage").css("display") == "block";

      if (isValid && !hasError) {
        //$('#createPasswordForm').submit(function() {
        //});
        showLoadingCreatePasswordButton();

        var postData = {
          email: getURLParameter("email"),
          provider: _provider,
          token: getURLParameter("token"),
          createPassword: $("#createPassword").val(),
          createPasswordConfirm: $("#createPasswordConfirm").val(),
        };

        try {
          $.ajax({
            type: "POST",
            url: "/Handlers/CreatePassword.ashx",
            data: JSON.stringify(postData),
            contentType: "application/json",
            dataType: "json",
            success: function (result) {
              if (result) {
                LoginSilent(
                  result.Message,
                  result.Email,
                  postData.createPassword
                );
              } else {
                showChangeOrCreatePasswordErrorMessage(result.Message);
              }
            },
            error: function (xhr) {
              var loginResult = xhr.responseJSON;
              var message = loginResult.Message;
              showChangeOrCreatePasswordErrorMessage(message);
            },
          });
        } catch (e) {
          showChangeOrCreatePasswordErrorMessage(e);
        }
      }
      return false;
    });
  }

  function LoginSilent(message, email, password) {
    $("#createPasswordButton").hide();
    $("#createPassword").attr("disabled", "disabled");
    $("#createPasswordConfirm").attr("disabled", "disabled");

    showSuccessMessageCreatePassword(message);

    var postData = {
      email: email,
      password: password,
      provider: _provider,
      callback: getURLParameter("callback"),
      captcha: responseItem,
      ipOrigin: localStorage.getItem('currentIP'),
    };

    $.ajax({
      type: "POST",
      url: "/Handlers/ExecuteLogin.ashx",
      data: JSON.stringify(postData),
      beforeSend: function () {
        showLoggingInOnPasswordCreateOrChange("Efetuando login...");
      },
      success: function (result) {
        showLoggingInOnPasswordCreateOrChange(result.Message);
        if (
          _provider == "valuegaia" ||
          _provider == "coldwell" ||
          _provider == "imob" ||
          _provider == "remax" ||
          _provider == "spin" ||
          _provider == "c21" ||
          _provider == "movix" ||
          _provider == "corretor" ||
          _provider == "imvista"
        ) {
          loginValueGaia(email, password);
        } else {
          top.location.href = result.RedirectUrl;
        }
      },
      error: function (xhr) {
        var loginResult = xhr.responseJSON;
        var errorMessage = loginResult.Message;
        showErrorMessageCreatePassword(errorMessage);
        hideLoadingLoginButton();
      },
      contentType: "application/json",
      dataType: "json",
    });
  }

  function SetForgotPasswordSubmit() {
    $("#forgotPasswordForm").submit(function () {
      hideAllMessagesForgotPasswordContent();

      var isValid = $(this).valid();

      if (isValid) {
        showLoadingForgotButton();

        var postData = {
          email: $("#forgotPasswordEmail").val(),
          provider: _provider,
        };

        $.ajax({
          type: "POST",
          url: "/Handlers/RecoverMyPassword.ashx",
          data: JSON.stringify(postData),
          success: function (result) {
            showLoginForm();
            showSuccessMessage(result.Message);
          },
          error: function (xhr) {
            var result = xhr.responseJSON;
            showForgotErrorMessage(result.Message);
            hideLoadingForgotButton();
          },
          contentType: "application/json",
          dataType: "json",
        });
      }

      return false;
    });
  }

  function SetLoginSubmit() {
    $("#loginForm").submit(function (e) {
      e.preventDefault();

      var recaptchaOn = !$(this).hasClass("no-recaptcha");
      if (recaptchaOn) {
        if (grecaptcha.enterprise.getResponse() == "") return false;
      }      

      //hideAllMessagesLoginContent();

      var isValid = $(this).valid();
      if (isValid) {
        showLoadingLoginButton();

        if (_provider.toLowerCase() == "incorp")
          loginIncorp($("#email").val(), $("#password").val());
        else if (_provider.toLowerCase() == "gaiamanager")
          loginGaiaManager($("#email").val(), $("#password").val());
        else if (_provider.toLowerCase() == "gaiaads")
          loginGaiaAds($("#email").val(), $("#password").val());
        else if (_provider.toLowerCase() == "email")
          loginGaiaMail($("#email").val(), $("#password").val());
        else if (_provider.toLowerCase() == "ads")
          loginGaiaAds($("#email").val(), $("#password").val());
        else {
          var postData = {
            email: $("#email").val(),
            password: $("#password").val(),
            provider: _provider,
            callback: getURLParameter("callback"),
            captcha: responseItem,
            ipOrigin: localStorage.getItem('currentIP'),
          };

          $.ajax({
            type: "POST",
            url: "/Handlers/ExecuteLogin.ashx",
            data: JSON.stringify(postData),
            success: function (result) {
              localStorage.removeItem("recaptcha");
              showSuccessMessage(result.Message);

              if (result.HasExpiredPassword) {
                expiredPasswordToken = result.ExpiredPasswordToken;
                encryptedEmail = result.EncryptedEmail;
                setTimeout(function () {
                  showChangePassword(
                    "Senha expirada, redefina agora",
                    "Redefinir minha senha"
                  );
                  SetChangePasswordSubmit();
                }, 2000);
              } else {
                if (
                  _provider == "valuegaia" ||
                  _provider == "coldwell" ||
                  _provider == "remax" ||
                  _provider == "spin" ||
                  _provider == "c21" ||
                  _provider == "imob" ||
                  _provider == "movix" ||
                  _provider == "corretor"
                ) {
                  loginValueGaia(postData.email, postData.password);
                } else {
                  top.location.href = result.RedirectUrl;
                }
              }
            },
              error: function (xhr) {
              var loginResult = xhr.responseJSON;
              var message = loginResult.Message;
              showErrorMessage(message);
              hideLoadingLoginButton();
              $(".submitButton").addClass("disabled");
              //grecaptcha.enterprise.reset();
              setTimeout(() => {
                window.location.reload();
              }, 5000);
            },
            contentType: "application/json",
            dataType: "json",
          });
        }
      }
      return false;
    });
  }

  function loginValueGaiaDirect(
    email,
    password,
    gaiaads_accesstoken,
    gaiaads_refreshtoken
  ) {
    $("#vgEmail").val(email);
    $("#vgPassword").val(password);

    var page = getURLParameter("page");
    if (page != null && page != "") $("#txtPage").val(page);

    var value = getURLParameter("value");
    if (value != null && value != "") $("#txtValue").val(value);

    if (gaiaads_accesstoken != null && gaiaads_accesstoken != "")
      $("#txtGaiaAdsAccessToken").val(gaiaads_accesstoken);

    if (gaiaads_refreshtoken != null && gaiaads_refreshtoken != "")
      $("#txtGaiaAdsRefreshToken").val(gaiaads_refreshtoken);

    $("#valueGaiaForm").submit();
  }

  function loginValueGaia(
    email,
    password,
    gaiaads_accesstoken,
    gaiaads_refreshtoken
  ) {
    loginValueGaiaDirect(
      email,
      password,
      gaiaads_accesstoken,
      gaiaads_refreshtoken
    );
    const today = new Date();
    const expireDate = new Date(today.setMonth(today.getMonth() + 6));
    const cookieMkt = `gaia_mkt_ck=true; domain=.ingaia.com.br; expires=${expireDate.toUTCString()}; path=/`;
    document.cookie = cookieMkt;
  }

  function loginCampus(email, password, redirectUrl) {
    $("#vgEmail").val(email);
    $("#vgPassword").val(password);
    var data = $("#valueGaiaForm").serialize();

    $.post(
      "https://imob.valuegaia.com.br/login-valida.aspx",
      data,
      function (result) {
        top.location.href = redirectUrl;
      }
    );
  }

  function loginIncorp(email, password) {
    $("#user_email").val(email);
    $("#user_password").val(password);
    $("#incorpForm").submit();
  }

  function loginGaiaMail(email, password) {
    $("#gaiamail_email").val(email);
    $("#gaiamail_password").val(btoa(password));
    $("#gaiaMailForm").submit();
  }

  function loginGaiaManager(email, password) {
    $("#authentication_user_email").val(email);
    $("#authentication_user_password").val(password);
    $("#gaiaManagerForm").submit();
  }

  function loginGaiaAds(email, password) {
    var postData = {
      email: email,
      password: password,
      provider: _provider,
      callback: getURLParameter("callback"),
    };

    $.ajax({
      type: "POST",
      url: "/Handlers/ExecuteLogin.ashx",
      data: JSON.stringify(postData),
      success: function (result) {
        showSuccessMessage(result.Message);
        if (result.loginResultGaiaAds.IsAuthenticated) {
          top.location.href = result.RedirectUrl;
        }
      },
      error: function (xhr) {
        var loginResult = xhr.responseJSON;
        var message = loginResult.Message;
        showErrorMessage(message);
        hideLoadingLoginButton();
      },
      contentType: "application/json",
      dataType: "json",
    });
  }

  function loginEmailRules() {
    $("#forgotPasswordLink").hide();
  }

  function loginIncorpRules() {
    $("#forgotPasswordLink").hide();

    var error = getURLParameter("erro");

    if (error != null && error != "") {
      $("#errorMessage").html('<i class="fa fa-close"></i>' + error);
      $("#errorMessage").show();
    }
  }

  function loginGaiaManagerRules() {
    $("#forgotPasswordLink").hide();

    var error = getURLParameter("erro");

    if (error != null && error != "") {
      $("#errorMessage").html('<i class="fa fa-close"></i>' + error);
      $("#errorMessage").show();
    }
  }

  function loginCampusRules() {
    var error = getURLParameter("erro");
    if (error != null && error != "") {
      $("#errorMessage").html('<i class="fa fa-close"></i>' + error);
      $("#errorMessage").show();
    }
  }

  function changeFavicon(src) {
    var link = document.createElement("link"),
      oldLink = document.getElementById("dynamic-favicon");
    link.type = "image/x-icon";
    link.id = "dynamic-favicon";
    link.rel = "shortcut icon";
    link.href = src;
    if (oldLink) {
      document.head.removeChild(oldLink);
    }
    document.head.appendChild(link);
  }

  function favIconSelector() {
    var url = "/img/";

    switch (_provider) {
      case "valuegaia":
        url += "favicon01.ico";
        break;
      case "imob":
        url += "favicon01.ico";
        break;
      case "corretor":
        url += "favicon01.ico";
        break;
      case "gaiaedu":
        url += "favicon03.ico";
        break;
      case "incorp":
        url += "favicon02.ico";
        break;
      case "gaiaadm":
        url += "favicon04.ico";
        break;
      case "locacao":
        url += "favicon01.ico";
        break;
      case "financeiro":
        url += "favicon01.ico";
        break;
      case "coldwell":
        //adiciona classes
        $("#forgotPasswordLink").addClass("coldwell");
        $(".voltarParaLogin").addClass("coldwell");

        url += "coldwell/favicon.ico";
        break;
      case "gaiamanager":
        url += "favicon05.ico";
        break;
      case "gaiaads":
        url += "favicon06.ico";
        break;
      default:
        url += "favicon01.ico";
    }

    changeFavicon(url);
  }

    jQuery(function ($) {
    $("#forgotPasswordLink").click(function () {
      showForgotPassword();
    });
    $("#voltarParaLogin").click(function () {
      const href = window.location.href;
      const newURL = href.slice(0, href.indexOf("?"));
      window.location.href = newURL;
    });
    $("#userAlreadyExistsLink").click(function () {
      showForgotPassword();
    });
    $("#userAlreadyExistsLink").click(function () {
      showForgotPassword();
    });
    $("#userAlreadyExistsLogin").click(function () {
      showLoginForm();
    });
    $("#linkVoltarParaLogin").click(function () {
      showLoginForm();
    });
    favIconSelector();

    if (getURLParameter("email") != null)
      $("#email").val(getURLParameter("email"));

    $("#email").focus();

    $("#logo").attr(
      "href",
      "https://" +
        window.location.host +
        window.location.pathname +
        "?provider=" +
        _provider
    );

    $("#txtWiki").val(getURLParameter("wiki"));

    if (document.URL.indexOf("gaiainc.aspx") >= 0) $("#txtGaiaInc").val(true);

    if (document.URL.indexOf("eid") >= 0)
      $("#txtEid").val(getURLParameter("eid"));

    var newpassword = getURLParameter("np");
    var changepassword = getURLParameter("cp");

    if (newpassword != null) {
      LoginCheck();
      SetCreatePasswordSubmit();
    } else if (changepassword != null) {
      showChangePassword();
      SetChangePasswordSubmit();
    }

    SetForgotPasswordSubmit();
    SetLoginSubmit();

    var validationOptions = {
      errorElement: "span",
      errorPlacement: function (error, element) {
        if (element.is(":checkbox")) {
          error.appendTo(element.parents(".boxTermos"));
        } else if ($(element).is("select")) {
          error.appendTo(element.parents(".form-group"));
        } else {
          error.insertAfter(element.parents(".form-group"));
        }
      },
    };
 
    jQuery.extend(jQuery.validator.messages, {
      required: "Campo obrigatório",
      email: "Favor digitar um email válido",
    });

    $("#loginForm").validate(validationOptions);
    $("#forgotPasswordForm").validate(validationOptions);
    $("#createPasswordForm").validate(validationOptions);

    RemoveInvalidConfirmation();

    if (_provider.toLowerCase() == "incorp") loginIncorpRules();
    if (_provider.toLowerCase() == "email" || _provider.toLowerCase() == "ads")
      loginEmailRules();
    if (_provider.toLowerCase() == "gaiamanager") loginGaiaManagerRules();
    if (
      _provider.toLowerCase() == "gaiaedu" ||
      _provider.toLowerCase() == "campus"
    )
      loginCampusRules();

    $(".bt-close").click(function () {
      $("#alertApp").fadeOut("slow");
    });
  });
})(jQuery);
