import { createHash, randomBytes, randomUUID } from 'crypto';

/** Token opaco de alta entropia (não é JWT: nada a decodificar no cliente). */
export function generateOpaqueToken(): string {
  return randomBytes(48).toString('base64url');
}

/** SHA-256 é suficiente: o token já tem 384 bits de entropia (sem necessidade de bcrypt). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newTokenFamilyId(): string {
  return randomUUID();
}
