// VALIDATION
// TODO: Use shared signup validation here (module should be added with script tag)
// TODO: Rewrite everything with jQuery

const signupForm = document.getElementById('signup-form');

// Select input fields
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupConfirmPassword = document.getElementById('signup-confirm-password');

// Select validation alerts
const signupEmailEmptyAlert = document.getElementById('signup-email-empty-alert');
const signupPasswordEmptyAlert = document.getElementById('signup-password-empty-alert');
const signupConfirmPasswordEmptyAlert = document.getElementById('signup-confirm-password-empty-alert');
const signupEmailInvalidAlert = document.getElementById('signup-email-invalid-alert');
const signupPasswordInvalidAlert = document.getElementById('signup-password-invalid-alert');
const signupConfirmPasswordMatchAlert = document.getElementById('signup-confirm-password-match-alert');

// Select email exists alert - only to clear server-side validation
const signupEmailExistsAlert = document.getElementById('signup-email-exists-alert');

// Create variable to save validation status
let validSignupForm;

const setSignupInvalid = (inputAlert, input) => {
  inputAlert.classList.add('display-block');
  input.classList.add('red-border');
  validSignupForm = false;
};

const clearSignupValidation = () => {
  validSignupForm = true;

  signupEmailEmptyAlert.classList.remove('display-block');
  signupPasswordEmptyAlert.classList.remove('display-block');
  signupConfirmPasswordEmptyAlert.classList.remove('display-block');

  signupEmailInvalidAlert.classList.remove('display-block');
  signupPasswordInvalidAlert.classList.remove('display-block');
  signupConfirmPasswordMatchAlert.classList.remove('display-block');

  signupEmailExistsAlert.classList.remove('display-block');

  signupEmail.classList.remove('red-border');
  signupPassword.classList.remove('red-border');
  signupConfirmPassword.classList.remove('red-border');
};

$('#signup-form').submit(event => {
  event.preventDefault();

  // Get values of input fields
  const signupEmailValue = signupEmail.value;
  const signupPasswordValue = signupPassword.value;
  const signupConfirmPasswordValue = signupConfirmPassword.value;

  clearSignupValidation();

  // Validate email (must not be empty and have valid format)
  if (!inputNotEmpty(signupEmailValue)) {
    setSignupInvalid(signupEmailEmptyAlert, signupEmail);
  } else if (!emailValid(signupEmailValue)) {
    setSignupInvalid(signupEmailInvalidAlert, signupEmail);
  };

  // Validate password (must not be empty and have valid format)
  if (!inputNotEmpty(signupPasswordValue)) {
    setSignupInvalid(signupPasswordEmptyAlert, signupPassword);
  } else if (!passwordValid(signupPasswordValue)) {
    setSignupInvalid(signupPasswordInvalidAlert, signupPassword);
  };

  // Validate confirm password (must not be empty and match password)
  if (!inputNotEmpty(signupConfirmPasswordValue)) {
    setSignupInvalid(signupConfirmPasswordEmptyAlert, signupConfirmPassword);
  } else if (!passwordMatch(signupPasswordValue,signupConfirmPasswordValue)) {
    setSignupInvalid(signupConfirmPasswordMatchAlert, signupConfirmPassword);
  };

  if (validSignupForm) {
    // Post signup form and show form alerts for server side validation
    $.post('/signup', $('#signup-form').serialize())
    .done(response => {
      console.log(response.ok)
      if (!response.ok) {
        const validationParams = response;
        if (validationParams.emailEmptyAlert === true) {
          $('#signup-email-empty-alert').addClass('display-block');
          $('#signup-email').addClass('red-border');
        };
        if (validationParams.emailInvalidAlert === true) {
          $('#signup-email-invalid-alert').addClass('display-block');
          $('#signup-email').addClass('red-border');
        };
        if (validationParams.emailExistsAlert === true) {
          $('#signup-email-exists-alert').addClass('display-block');
          $('#signup-email').addClass('red-border');
        };
        if (validationParams.passwordEmptyAlert === true) {
          $('#signup-password-empty-alert').addClass('display-block');
          $('#signup-password').addClass('red-border');
        };
        if (validationParams.passwordInvalidAlert === true) {
          $('#signup-password-invalid-alert').addClass('display-block');
          $('#signup-password').addClass('red-border');
        };
        if (validationParams.confirmPasswordEmptyAlert === true) {
          $('#signup-confirm-password-empty-alert').addClass('display-block');
          $('#signup-confirm-password').addClass('red-border');
        };
        if (validationParams.confirmPasswordMatchAlert === true) {
          $('#signup-confirm-password-match-alert').addClass('display-block');
          $('#signup-confirm-password').addClass('red-border');
        };
      } else if (response.ok) {
        modalClose();
        window.location = `https://www.strava.com/oauth/authorize?client_id=${stravaClient}&response_type=code&redirect_uri=http://${host}:${port}&approval_prompt=force&state=${response.userId}&scope=activity:read`;
      };
    })
    .fail(error => {
      // display error
    });
  };
});

// Password:
// At least 8 chars
// Contains at least one digit
// Contains at least one lower alpha char and one upper alpha char
// Contains at least one char within a set of special chars (@#%$^ etc.)
// Does not contain space, tab, etc.