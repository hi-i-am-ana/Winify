// VALIDATION
// TODO: Use shared login validation here (module should be added with script tag)
// TODO: Rewrite everything with jQuery

const loginForm = document.getElementById('login-form');

// Select input fields
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');

// Select validation alerts
const loginEmailEmptyAlert = document.getElementById('login-email-empty-alert');
const loginPasswordEmptyAlert = document.getElementById('login-password-empty-alert');
const loginEmailInvalidAlert = document.getElementById('login-email-invalid-alert');
const loginPasswordInvalidAlert = document.getElementById('login-password-invalid-alert');

// Select email missing and unconfirmed and password incorrect alerts - only to clear server-side validation
const loginEmailMissingAlert = document.getElementById('login-email-missing-alert');
const loginEmailUnconfirmedAlert = document.getElementById('login-email-unconfirmed-alert');
const loginPasswordIncorrectAlert = document.getElementById('login-password-incorrect-alert');

// Create variable to save validation status
let validLoginForm;

const setLoginInvalid = (inputAlert, input) => {
  inputAlert.classList.add('display-block');
  input.classList.add('red-border');
  validLoginForm = false;
};

const clearLoginValidation = () => {
  validLoginForm = true;

  loginEmailEmptyAlert.classList.remove('display-block');
  loginPasswordEmptyAlert.classList.remove('display-block');

  loginEmailInvalidAlert.classList.remove('display-block');
  loginPasswordInvalidAlert.classList.remove('display-block');

  loginEmailMissingAlert.classList.remove('display-block');
  loginEmailUnconfirmedAlert.classList.remove('display-block');
  loginPasswordIncorrectAlert.classList.remove('display-block');

  loginEmail.classList.remove('red-border');
  loginPassword.classList.remove('red-border');
};

$('#login-form').submit(event => {
  event.preventDefault();

  // Get values of input fields
  const loginEmailValue = loginEmail.value;
  const loginPasswordValue = loginPassword.value;

  clearLoginValidation();

  // Validate email (must not be empty and have valid format)
  if (!inputNotEmpty(loginEmailValue)) {
    setLoginInvalid(loginEmailEmptyAlert, loginEmail);
  } else if (!emailValid(loginEmailValue)) {
    setLoginInvalid(loginEmailInvalidAlert, loginEmail);
  };

  // Validate password (must not be empty and have valid format)
  if (!inputNotEmpty(loginPasswordValue)) {
    setLoginInvalid(loginPasswordEmptyAlert, loginPassword);
  } else if (!passwordValid(loginPasswordValue)) {
    setLoginInvalid(loginPasswordInvalidAlert, loginPassword);
  };

  if (validLoginForm) {
    // Post login form and show form alerts for server side validation
    $.post('/login', $('#login-form').serialize())
    .done(response => {
      console.log(response)
      if (!response.accessToken && !response.error) {
        const validationParams = response;
        if (validationParams.emailEmptyAlert === true) {
          $('#login-email-empty-alert').addClass('display-block');
          $('#login-email').addClass('red-border');
        };
        if (validationParams.emailInvalidAlert === true) {
          $('#login-email-invalid-alert').addClass('display-block');
          $('#login-email').addClass('red-border');
        };
        if (validationParams.emailMissingAlert === true) {
          $('#login-email-missing-alert').addClass('display-block');
          $('#login-email').addClass('red-border');
        };
        if (validationParams.emailUnconfirmedAlert === true) {
          $('#login-email-unconfirmed-alert').addClass('display-block');
          $('#login-email').addClass('red-border');
        };
        if (validationParams.passwordEmptyAlert === true) {
          $('#login-password-empty-alert').addClass('display-block');
          $('#login-password').addClass('red-border');
        };
        if (validationParams.passwordInvalidAlert === true) {
          $('#login-password-invalid-alert').addClass('display-block');
          $('#login-password').addClass('red-border');
        };
        if (validationParams.passwordIncorrectAlert === true) {
          $('#login-password-incorrect-alert').addClass('display-block');
          $('#login-password').addClass('red-border');
        };
      } else if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        modalClose();
        window.location = '/';
      };
      // TODO: One more if for prisma client error
    })
    .fail(err => {
      // display error
    });
  };
});