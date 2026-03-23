import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.FORMCATCH_SECRET;
  if (!secret) throw new Error("FORMCATCH_SECRET env var not set");
  // SHA-256 hash the secret to get exactly 32 bytes
  const { createHash } = require("crypto");
  return createHash("sha256").update(secret).digest();
}

export function encryptEmail(email: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(email, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Pack: iv (12) + tag (16) + ciphertext
  const packed = Buffer.concat([iv, tag, encrypted]);
  return packed
    .toString("base64url")
    .replace(/=/g, "");
}

export function decryptEmail(formId: string): string {
  const key = getKey();
  // Pad base64url if needed
  let b64 = formId;
  while (b64.length % 4 !== 0) b64 += "=";
  const packed = Buffer.from(b64, "base64url");
  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const encrypted = packed.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
