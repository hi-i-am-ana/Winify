// TODO: Use shared signup validation here (module should be added with script tag)
const form = document.getElementById('form');

// Select input fields
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');

// Select validation alerts
const passwordEmptyAlert = document.getElementById('password-empty-alert');
const confirmPasswordEmptyAlert = document.getElementById('confirmPassword-empty-alert');
const passwordInvalidAlert = document.getElementById('password-invalid-alert');
const confirmPasswordMatchAlert = document.getElementById("confirmPassword-match-alert");

// Create variable to save validation status
let validForm;

form.onsubmit = (event) => {
  // Get values of input fields
  const passwordValue = password.value;
  const confirmPasswordValue = confirmPassword.value;

  clearValidation();

  // Validate password (must not be empty and have valid format)
  if (!inputNotEmpty(passwordValue)) {
    setInvalid(passwordEmptyAlert, password);
  } else if (!passwordValid(passwordValue)) {
    setInvalid(passwordInvalidAlert, password);
  };

  // Validate confirm password (must not be empty and match password)
  if (!inputNotEmpty(confirmPasswordValue)) {
    setInvalid(confirmPasswordEmptyAlert, confirmPassword);
  } else if (!passwordMatch(passwordValue,confirmPasswordValue)) {
    setInvalid(confirmPasswordMatchAlert, confirmPassword);
  };

  if (!validForm) {
    event.preventDefault();
  };
};

const inputNotEmpty = (inputValue) => inputValue !== '';

const passwordValid = (inputValue) => {
  const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/;
  return passwordRegex.test(inputValue);
};

const passwordMatch = (passwordValue, confirmPasswordValue) => passwordValue === confirmPasswordValue;

const setInvalid = (inputAlert, input) => {
  inputAlert.classList.add('display-block');
  input.classList.add('red-border');
  validForm = false;
};

const clearValidation = () => {
  validForm = true;

  passwordEmptyAlert.classList.remove('display-block');
  confirmPasswordEmptyAlert.classList.remove('display-block');
  passwordInvalidAlert.classList.remove('display-block');
  confirmPasswordMatchAlert.classList.remove('display-block');

  password.classList.remove('red-border');
  confirmPassword.classList.remove('red-border');
};

// Password:
// At least 8 chars
// Contains at least one digit
// Contains at least one lower alpha char and one upper alpha char
// Contains at least one char within a set of special chars (@#%$^ etc.)
// Does not contain space, tab, etc.