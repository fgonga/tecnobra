interface QueryError extends Error {
  code?: string | number;
  errno?: number;
  sqlMessage?: string;
  sqlState?: string;
  sql?: string;
}

interface DatabaseErrorHandled {
  success: false;
  code: string | number;
  message: string;
  original?: any;
}

export function handleDatabaseException(err: QueryError): DatabaseErrorHandled {
  if (!err) {
    return { success: false, code: 500, message: "Unknown database error" };
  }

  if (err.code) {
    let message = "Database error";
    let code: string | number = err.code;

    switch (err.code) {
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
        message = "Não é possível eliminar registro referenciado";
        break;
      case "ER_PARSE_ERROR":
        message = "Erro de sintaxe SQL";
        break;
      case "ER_TRUNCATED_WRONG_VALUE":
        message = "Valor inválido para o tipo de coluna";
        break;
      default:
        message = err.sqlMessage || message;
    }

    return {
      success: false,
      code,
      message,
      original: err,
    };
  }

  return {
    success: false,
    code: 500,
    message: err.message || "Unknown database error",
    original: err,
  };
}
