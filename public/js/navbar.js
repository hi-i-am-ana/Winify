$.ajax({
  url: '/is_authorised',
  method: 'GET',
  headers: {
    token: localStorage.getItem('accessToken')
  }
})
.then((response) => {
  if (response.message === 'no token' || response.message === 'ivalid token') {
    $('.nav-login-link').removeClass('display-none');
    $('.nav-logout-link').addClass('display-none');
    $('.nav-profile-link').addClass('display-none');
  } else if (response.userId) {
    $('.nav-login-link').addClass('display-none');
    $('.nav-logout-link').removeClass('display-none');
    $('.nav-profile-link').removeClass('display-none');
  };
})
.catch(error => {
  console.log(error.message);
});