const validation = (emailValue, emailEmptyAlert, emailInvalidAlert, passwordValue, passwordEmptyAlert, passwordInvalidAlert, setInvalid) => {
  const inputNotEmpty = (inputValue) => inputValue !== '';

  const emailValid = (inputValue) => {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(inputValue);
  };

  const passwordValid = (inputValue) => {
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/;
    return passwordRegex.test(inputValue);
  };

  // Validate email (must not be empty and have valid format)
  if (!inputNotEmpty(emailValue)) {
    setInvalid(emailEmptyAlert);
  } else if (!emailValid(emailValue)) {
    setInvalid(emailInvalidAlert);
  };

  // Validate password (must not be empty and have valid format)
  if (!inputNotEmpty(passwordValue)) {
    setInvalid(passwordEmptyAlert);
  } else if (!passwordValid(passwordValue)) {
    setInvalid(passwordInvalidAlert);
  };
};

module.exports = validation;