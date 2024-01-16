export const checkValidData = (email, password) => {
  const validEmail = email.length > 0;
  const validPassword = password.length > 5;

  if (!validEmail) return "Email id cannot be blank";
  if (!validPassword) return "password should be 6 characters";

  return null;
};
