const validation = (passwordValue, passwordEmptyAlert, passwordInvalidAlert, confirmPasswordValue, confirmPasswordEmptyAlert, confirmPasswordMatchAlert, setInvalid) => {
  const inputNotEmpty = (inputValue) => inputValue !== '';

  const passwordValid = (inputValue) => {
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/;
    return passwordRegex.test(inputValue);
  };

  const passwordMatch = (passwordValue, confirmPasswordValue) => passwordValue === confirmPasswordValue;

  // Validate password (must not be empty and have valid format)
  if (!inputNotEmpty(passwordValue)) {
    setInvalid(passwordEmptyAlert);
  } else if (!passwordValid(passwordValue)) {
    setInvalid(passwordInvalidAlert);
  };

  // Validate confirm password (must not be empty and match password)
  if (!inputNotEmpty(confirmPasswordValue)) {
    setInvalid(confirmPasswordEmptyAlert);
  } else if (!passwordMatch(passwordValue,confirmPasswordValue)) {
    setInvalid(confirmPasswordMatchAlert);
  };
};

module.exports = validation;

// Password:
// At least 8 chars
// Contains at least one digit
// Contains at least one lower alpha char and one upper alpha char
// Contains at least one char within a set of special chars (@#%$^ etc.)
// Does not contain space, tab, etc.