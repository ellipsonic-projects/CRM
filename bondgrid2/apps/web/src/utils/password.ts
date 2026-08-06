export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 16;

const GENERATED_PASSWORD_LENGTH = 20;
const GENERATED_PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

export function getPasswordPolicyMessage(): string {
  return `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`;
}

export function validateCreatedPassword(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return getPasswordPolicyMessage();
  }

  return undefined;
}

export function generateSecurePassword(): string {
  const alphabetLength = GENERATED_PASSWORD_ALPHABET.length;
  const maxAllowedByte = Math.floor(256 / alphabetLength) * alphabetLength - 1;
  const password: string[] = [];

  while (password.length < GENERATED_PASSWORD_LENGTH) {
    const bytes = new Uint8Array(GENERATED_PASSWORD_LENGTH);
    window.crypto.getRandomValues(bytes);

    for (const byte of bytes) {
      if (byte > maxAllowedByte) {
        continue;
      }

      password.push(GENERATED_PASSWORD_ALPHABET[byte % alphabetLength]);

      if (password.length === GENERATED_PASSWORD_LENGTH) {
        break;
      }
    }
  }

  return password.join('');
}
