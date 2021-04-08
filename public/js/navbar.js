$.ajax({
  url: '/is_authorised',
  method: 'GET',
  headers: {
    token: localStorage.getItem('accessToken')
  }
})
.then((response) => {
  if (response.message === 'no token' || response.message === 'ivalid token') {
    $('.navbar-login-link').removeClass('display-none');
    $('.navbar-logout-link').addClass('display-none');
    $('.navbar-profile-link').addClass('display-none');
  } else if (response.userId) {
    $('.navbar-login-link').addClass('display-none');
    $('.navbar-logout-link').removeClass('display-none');
    $('.navbar-profile-link').removeClass('display-none');
    $('.navbar-profile-image').attr('src', response.profilePictureUrl)
  };
})
.catch(error => {
  console.log(error.message);
});