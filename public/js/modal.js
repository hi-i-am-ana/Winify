const modalClose = () => {
  $('.modal1').removeClass('display-block');
  clearLoginValidation();
  clearSignupValidation();
  clearPasswordForgotValidation();

  $('#login-email').val('');
  $('#login-password').val('');
  $('#signup-email').val('');
  $('#signup-password').val('');
  $('#signup-confirm-password').val('');
  $('#password-forgot-email').val('');

  $('.main-container').removeClass('blurred');
};

const forgotPasswordOpen = () => {
  $('.password-forgot-modal').addClass('display-block');
  $('.signup-modal').removeClass('display-block');
  $('.login-modal').removeClass('display-block');

  $('.main-container').addClass('blurred');
};

const signupOpen = () => {
  $('.password-forgot-modal').removeClass('display-block');
  $('.signup-modal').addClass('display-block');
  $('.login-modal').removeClass('display-block');

  $('.main-container').addClass('blurred');
};

const loginOpen = () => {
  $('.password-forgot-modal').removeClass('display-block');
  $('.signup-modal').removeClass('display-block');
  $('.login-modal').addClass('display-block');
  $('.strava-auth-success-popup').removeClass('display-block');

  $('.main-container').addClass('blurred');
};

$('.login-link, .navbar-login-link').click(loginOpen);
$('.signup-link').click(signupOpen);
$('.password-forgot-link').click(forgotPasswordOpen);
$('.close-modal-button').click(modalClose);