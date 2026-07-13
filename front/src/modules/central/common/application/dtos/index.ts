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
 *
 */
export type UserType = "superadmin" | "admin" | "user" | "account" | "helper";
export type SystemRules = "*" | "orders" | "payments" | "coupons" | "config" | "users" | "reports";
export interface User {
  id?: number;
  name: string;
  username: string;
  phone: string;
  password: string;
  status: number;
  role?: UserType;
}

