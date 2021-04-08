$('.navbar-logout-link').click(() => {
  localStorage.removeItem('accessToken');
  window.location = '/';
});