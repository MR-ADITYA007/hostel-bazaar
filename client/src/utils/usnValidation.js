export const USN_REGEX = /^1ms(23|24|25|26)[a-zA-Z]{2,3}\d{3}$/i;

export function isValidUSN(usn) {
  return USN_REGEX.test(usn);
}
