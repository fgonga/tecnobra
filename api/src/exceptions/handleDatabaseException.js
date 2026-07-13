export function handleDatabaseException(err) {
    if (!err) {
        return { success: false, code: 500, message: "Unknown database error" };
    }
    // MySQL2 error
    if (err.code) {
        const mysqlErr = err;
        let message = "Database error";
        let code = mysqlErr.code;
        // Tratamento específico
        switch (mysqlErr.code) {
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
                message = mysqlErr.sqlMessage || message;
        }
        return {
            success: false,
            code,
            message,
            original: mysqlErr,
        };
    }
    // Caso seja outro tipo de erro
    if (err instanceof Error) {
        return {
            success: false,
            code: 500,
            message: err.message,
            original: err,
        };
    }
    return { success: false, code: 500, message: "Unknown database error", original: err };
}
