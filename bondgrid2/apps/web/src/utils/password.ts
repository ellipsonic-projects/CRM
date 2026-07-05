export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

const GENERATED_PASSWORD_LENGTH = 20;
const GENERATED_PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

export function getPasswordPolicyMessage(): string {
  return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
}

export function validateCreatedPassword(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return getPasswordPolicyMessage();
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or less.`;
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
