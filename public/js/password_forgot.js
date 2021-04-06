// VALIDATION
// TODO: Use shared password-forgot validation here (module should be added with script tag)
// TODO: Rewrite everything with jQuery
const passwordForgotForm = document.getElementById('password-forgot-form');

// Select input fields
const passwordForgotEmail = document.getElementById('password-forgot-email');

// Select validation alerts
const passwordForgotEmailEmptyAlert = document.getElementById('password-forgot-email-empty-alert');
const passwordForgotEmailInvalidAlert = document.getElementById('password-forgot-email-invalid-alert');

// Select email missing and unconfirmed alerts - only to clear server-side validation
const passwordForgotEmailMissingAlert = document.getElementById('password-forgot-email-missing-alert');
const passwordForgotEmailUnconfirmedAlert = document.getElementById('password-forgot-email-unconfirmed-alert');

// Create variable to save validation status
let validPasswordForgotForm;

const setPasswordForgotInvalid = (inputAlert, input) => {
  inputAlert.classList.add('display-block');
  input.classList.add('red-border');
  validPasswordForgotForm = false;
};

const clearPasswordForgotValidation = () => {
  validPasswordForgotForm = true;

  passwordForgotEmailEmptyAlert.classList.remove('display-block');
  passwordForgotEmailInvalidAlert.classList.remove('display-block');
  passwordForgotEmailMissingAlert.classList.remove('display-block');
  passwordForgotEmailUnconfirmedAlert.classList.remove('display-block');

  passwordForgotEmail.classList.remove('red-border');
};

$('#password-forgot-form').submit(event => {
  event.preventDefault();

  // Get values of input fields
  const passwordForgotEmailValue = passwordForgotEmail.value;

  clearPasswordForgotValidation();

  // Validate email (must not be empty and have valid format)
  if (!inputNotEmpty(passwordForgotEmailValue)) {
    setPasswordForgotInvalid(passwordForgotEmailEmptyAlert, passwordForgotEmail);
  } else if (!emailValid(passwordForgotEmailValue)) {
    setPasswordForgotInvalid(passwordForgotEmailInvalidAlert, passwordForgotEmail);
  };

  if (validPasswordForgotForm) {
    // Post password forgot form and show form alerts for server side validation
    $.post('/password/forgot', $('#password-forgot-form').serialize())
    .done(response => {
      console.log(response.ok)
      if (!response.ok) {
        const validationParams = response;
        if (validationParams.emailEmptyAlert === true) {
          $('#password-forgot-email-empty-alert').addClass('display-block');
          $('#password-forgot-email').addClass('red-border');
        };
        if (validationParams.emailInvalidAlert === true) {
          $('#password-forgot-email-invalid-alert').addClass('display-block');
          $('#password-forgot-email').addClass('red-border');
        };
        if (validationParams.emailMissingAlert === true) {
          $('#password-forgot-email-missing-alert').addClass('display-block');
          $('#password-forgot-email').addClass('red-border');
        };
        if (validationParams.emailUnconfirmedAlert === true) {
          $('#password-forgot-email-unconfirmed-alert').addClass('display-block');
          $('#password-forgot-email').addClass('red-border');
        };
      } else if (response.ok) {
        modalClose();
        $('.password-forgot-popup').addClass('display-block');
        $('.password-forgot-email').text(`${response.email}`);
        $('.main-container').addClass('blurred');
      };
      // TODO: One more if for prisma client error
    })
    .fail(error => {
      // display error
    });
  };
});