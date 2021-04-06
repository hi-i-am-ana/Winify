const validation = (emailValue, emailEmptyAlert, emailInvalidAlert, setInvalid) => {
  const inputNotEmpty = (inputValue) => inputValue !== '';

  const emailValid = (inputValue) => {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(inputValue);
  };

  // Validate email (must not be empty and have valid format)
  if (!inputNotEmpty(emailValue)) {
    setInvalid(emailEmptyAlert);
  } else if (!emailValid(emailValue)) {
    setInvalid(emailInvalidAlert);
  };
};

module.exports = validation;