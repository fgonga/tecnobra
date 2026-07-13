/*
 *  Copyright © 2021 - 2050
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 */
import winston from "winston";
import path from "path";
import fs from "fs";
const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
export const AppLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()} - ${message}`;
        })
    ),
    transports: [new winston.transports.File({ filename: path.join(logDir, "app.log") })],
});
