const { sumArray, findMax, validateEmail, asyncOperation, processUser } = require('../index');

// Original tests (should pass now)
test('sumArray sums numbers', () => {
  expect(sumArray([1,2,3])).toBe(6);
});

test('sumArray empty array returns 0', () => {
  expect(sumArray([])).toBe(0);
});

// New tests with different types of bugs
describe('findMax function', () => {
  test('findMax returns maximum value', () => {
    expect(findMax([1, 5, 3, 9, 2])).toBe(9);
  });
  
  test('findMax empty array should handle gracefully', () => {
    expect(() => findMax([])).not.toThrow();
  });
});

describe('validateEmail function', () => {
  test('validateEmail accepts valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
  
  test('validateEmail rejects invalid emails', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
  });
  
  test('validateEmail handles edge cases', () => {
    expect(validateEmail('test+tag@example.com')).toBe(true);
    expect(validateEmail('test.name@example.co.uk')).toBe(true);
  });
});

describe('asyncOperation function', () => {
  test('asyncOperation doubles the input', async () => {
    const result = await asyncOperation(5);
    expect(result).toBe(10);
  });
  
  test('asyncOperation handles errors gracefully', async () => {
    // This should not throw even with invalid input
    await expect(asyncOperation(null)).resolves.toBeDefined();
  });
});

describe('processUser function', () => {
  test('processUser processes valid user', () => {
    const user = { name: 'John', age: 30, email: 'john@example.com' };
    const result = processUser(user);
    expect(result.name).toBe('JOHN');
    expect(result.email).toBe('john@example.com');
  });
  
  test('processUser handles null/undefined gracefully', () => {
    expect(() => processUser(null)).not.toThrow();
    expect(() => processUser(undefined)).not.toThrow();
  });
});
