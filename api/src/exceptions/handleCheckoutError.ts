// src/exceptions/handleDatabaseException.ts

interface DatabaseErrorHandled {
  success: false;
  code: string | number;
  message: string;
  original?: any;
}

export function handleCheckoutError(err: unknown): DatabaseErrorHandled {
  const e = err as any;

  if (!e) {
    return { success: false, code: 500, message: "Unknown database error" };
  }

  // Se for erro do MySQL2
  if (e.code) {
    let message = "Database error";
    let code: string | number = e.code;

    switch (e.code) {
      case "ER_BAD_NULL_ERROR":
        message = "Campo obrigatório está nulo";
        break;
      case "ER_DUP_ENTRY":
        message = "Registro duplicado";
        break;
      case "ER_NO_REFERENCED_ROW":
        message = "Chave estrangeira não encontrada";
        break;
      case "ER_ROW_IS_REFERENCED":
        message = "Não é possível excluir registro referenciado";
        break;
      case "ER_PARSE_ERROR":
        message = "Erro de sintaxe SQL";
        break;
      case "ER_TRUNCATED_WRONG_VALUE":
        message = "Valor inválido para o tipo de coluna";
        break;
      default:
        message = e.sqlMessage || message;
    }

    return {
      success: false,
      code,
      message,
      original: e,
    };
  }

  // Se for erro genérico do JS
  if (e instanceof Error) {
    return {
      success: false,
      code: 500,
      message: e.message,
      original: e,
    };
  }

  // Qualquer outra coisa não reconhecida
  return {
    success: false,
    code: 500,
    message: "Unknown database error",
    original: e,
  };
}
