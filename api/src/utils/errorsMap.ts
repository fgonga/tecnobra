// errorsMap.ts
export const ErrorsMap = {
  AUTH: {
    USER_NOT_FOUND: { code: "11", message: "Utilizador não encontrado." },
    WRONG_PASSWORD: { code: "12", message: "Palavra-passe incorreta." },
    PASSWORD_EXPIRED: { code: "13", message: "Palavra-passe expirada." },
  },
  PAYMENT: {
    TOO_MANY_ATTEMPTS: { code: "21", message: "Muitas tentativas de checkout. Tente novamente mais tarde." },
    CARD_INVALID: { code: "22", message: "Cartão inválido." },
  },
  VALIDATION: {
    REQUIRED_FIELD: { code: "31", message: "Campo obrigatório vazio." },
    INVALID_EMAIL: { code: "32", message: "Formato de e-mail inválido." },
  },
  SYSTEM: {
    SERVER_ERROR: { code: "41", message: "Erro interno do servidor." },
    TIMEOUT: { code: "42", message: "Timeout de requisição." },
    TOO_MANY_ATTEMPTS: { code: "44", message: "Muitas tentativas de checkout. Tente novamente mais tarde." },
  }
} as const;

// Tipagem dos erros
export type ErrorCode =
  typeof ErrorsMap[keyof typeof ErrorsMap][keyof typeof ErrorsMap[keyof typeof ErrorsMap]]["code"];

export type ErrorMessage =
  typeof ErrorsMap[keyof typeof ErrorsMap][keyof typeof ErrorsMap[keyof typeof ErrorsMap]]["message"];
