import { customAlphabet } from "nanoid";

export function generateCode(
  prefix = "PAY",
  maxLength = 15,
  onlyNumbers = false
): string {
  // Limita o prefixo e deixa apenas caracteres alfanuméricos
  const safePrefix = prefix.replace(/[^a-zA-Z0-9]/g, "").substring(0, maxLength);

  // Quantos caracteres ainda podem ser gerados
  const remainingLength = maxLength - safePrefix.length;
  if (remainingLength <= 0) return safePrefix;

  // Alfabeto
  const alphabet = onlyNumbers ? "0123456789" : "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  // Gera os caracteres restantes
  const nanoid = customAlphabet(alphabet, remainingLength);

  return safePrefix + nanoid();
}
