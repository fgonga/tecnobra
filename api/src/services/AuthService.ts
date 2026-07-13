import { User, UserModel } from "../models/user.model";
import { ProfileModel } from "../models/profile.model";
import { ValidationError } from "../exceptions/ValidationError";
import argon2 from "argon2";
import crypto from "crypto";
import { RecoveryCodeModel } from "../models/recoveryCode.model";
import type { Envelope } from "./SmsService";
import  { SmsService } from "./SmsService";
import app from "../../index";
export type AuthLoginCredentialsDto = {
  identification: string;
  password: string;
};

export class AuthService {
  static async login(credentials: AuthLoginCredentialsDto): Promise<any> {

    const user = await UserModel.findOneByWithPassword("username", credentials.identification) as User;

    if (!user) {
      throw new ValidationError(
          "Credenciais informadas não correspondem com nossos registos.",
          422
      );
    }
    if (!user.status){
      throw new ValidationError(
          "Utilizador desactivado, contacte o administrador do sistema.",
          422
      );
    }

    const isValid = await argon2.verify(user.password, credentials.password);
    if (!isValid) {
      throw new ValidationError(
          "Credenciais informadas não correspondem com nossos registos.",
          422
      );
    }

    const rules = await ProfileModel.getUserEffectiveRules((user as any).id);

    const token = app.jwt.sign(
        { sub: user.id, username: user.username, role: user.role, rules },
        { expiresIn: "1h" }
    );

    return {
      token,
      user: { ...user, password: undefined },
      rules,
    };
  }

  static async checkPhone(phone: string): Promise<{ exists: boolean }> {
    const user = await UserModel.findOneBy("phone", phone);
    if (!user) {
      throw new ValidationError(
          "Se este número existir, enviaremos uma mensagem contendo o código.",
          422,
          "success"
      );
    }

    const code = Math.floor(10000 + Math.random() * 90000).toString();
    await SmsService.send({
      to: phone,
      message: `Código de verificação: ${code}`,
      type: "sms",
    } as Envelope);

    const hashedCode = await argon2.hash(code);
    await RecoveryCodeModel.create({
      phone,
      code: hashedCode,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
      used: false,
      token: null,
    });

    return { exists: true };
  }

  static async verifyCode(
      phone: string,
      code: string
  ): Promise<{ valid: boolean; token: string }> {
    const recovery = await RecoveryCodeModel.findLatestByPhone(phone);
    if (!recovery) {
      throw new ValidationError("Nenhum código encontrado para este telefone.", 422);
    }

    if (recovery.expires_at < new Date() || recovery.used === true) {
      throw new ValidationError("Código expirado ou inválido.", 422);
    }

    const ok = await argon2.verify(recovery.code, code);
    if (!ok) {
      throw new ValidationError("Código inválido.", 422);
    }

    const token = crypto.randomBytes(32).toString("hex");
    await RecoveryCodeModel.updateToken(recovery.id, token);

    return { valid: true, token };
  }

  static async resetPassword(
      phone: string,
      password: string,
      token: string
  ): Promise<{ success: boolean }> {
    const recovery = await RecoveryCodeModel.findLatestByPhone(phone);
    if (
        !recovery ||
        !recovery.token ||
        recovery.expires_at < new Date() ||
        recovery.used === true
    ) {
      throw new ValidationError("Fluxo de recuperação inválido.", 422);
    }

    if (recovery.token !== token) {
      throw new ValidationError("Token inválido.", 422);
    }

    const hashedPassword = await argon2.hash(password);
    await UserModel.updateByPhone(phone, { password: hashedPassword });
    await RecoveryCodeModel.invalidate(recovery.id);

    return { success: true };
  }

}
