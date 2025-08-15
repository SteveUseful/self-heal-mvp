function findMax(arr) {
  // Handle empty arrays correctly
  if (arr.length === 0) {
    return undefined;
  } else {
    return Math.max(...arr);
  }
}

function validateEmail(email) {
  // Use a more robust regular expression for email validation
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function asyncOperation(data) {
  // Handle error conditions correctly
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data * 2 > 10) {
        resolve(data * 2);
      } else {
        reject(new Error("Async operation failed"));
      }
    }, 100);
  });
}

function processUser(user) {
  // Check for null values and handle them properly
  if (!user) {
    return undefined;
  }
  const name = user.name ? user.name.toUpperCase() : "";
  const age = user.age ? user.age : 0;
  const email = user.email ? user.email.toLowerCase() : "";
  return { name, age, email };
}