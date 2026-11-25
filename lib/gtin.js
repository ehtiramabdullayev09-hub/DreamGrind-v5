// Validates GTIN-8, GTIN-12, GTIN-13 and GTIN-14 values including the check digit.
export function isValidGtin(value) {
  const digits = String(value ?? '').trim();
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(digits)) return false;
  let sum = 0;
  let weight = 3;
  for (let index = digits.length - 2; index >= 0; index -= 1) {
    sum += Number(digits[index]) * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return (10 - (sum % 10)) % 10 === Number(digits.at(-1));
}
