/*
 *  Copyright © 2021 - 2025
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

export default function toMoney (value, digits = 2) {
    if (value === undefined) {
        return ''
    }
    value = value.toString()

    // Split the value into integer and decimal parts using comma and dot
    let [integerPart, decimalPart] = value.includes(',')
        ? value.split(',')
        : value.split('.')

    // Remove any dots from the integer part (thousands separators)
    integerPart = integerPart.replace(/\./g, '')

    // Add thousands separators to the integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    if (decimalPart) {
        decimalPart = limitDecimals(decimalPart, digits)
        return integerPart + (digits > 0 ? ',' + decimalPart : '')
    }

    return integerPart
}

function limitDecimals (value, digits) {
    if (digits === 0) {
        return ''
    }
    if (value === undefined) {
        return '0'.repeat(digits)
    }
    if (value.length >= digits) {
        return value.slice(0, digits)
    }
    while (value.length < digits) {
        value += '0'
    }
    return value
}

function replaceAll (value, search = ',', replacement = '.') {
    return value.split(search).join(replacement).replace('$', '')
}
