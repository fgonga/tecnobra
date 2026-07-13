import { UserModel } from "../models/user.model";
import { ValidationError } from "../exceptions/ValidationError";
import argon2 from "argon2";

export type UpdateUserDto = {
  name: string;
  username: string;
};

export type UpdatePhoneDto = {
  phone: string;
};

export type UpdatePasswordDto = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export class MyAccountService {
  static async updateUser(user: any, data: UpdateUserDto): Promise<boolean> {
    if (!data.name || !data.username) {
      throw new ValidationError("Nome e nome de utilizador são obrigatórios.", 422);
    }
    const found = await UserModel.findOneBy("username", user.username);
    await UserModel.update(found.id, { name: data.name, username: data.username });
    return true;
  }

  static async updatePhone(user:any, data: UpdatePhoneDto): Promise<boolean> {
    if (!data.phone) {
      throw new ValidationError("Número de telefone é obrigatório.", 422);
    }
    const userDb = await UserModel.findOneBy("username",user.username);
    await UserModel.update(userDb.id,{phone:data.phone})

    return true;
  }

  static async updatePassword(user: any, data: UpdatePasswordDto): Promise<boolean> {
    if (data.newPassword !== data.confirmPassword) {
      throw new ValidationError("As palavras-passe não coincidem.", 422);
    }

    if (!data.oldPassword) {
      throw new ValidationError("A palavra-passe antiga é obrigatória.", 422);
    }

    const userDb = await UserModel.findOneByWithPassword("username", user.username);
    if (!userDb) {
      throw new ValidationError("Utilizador não encontrado.", 404);
    }

    const valid = await argon2.verify(userDb.password, data.oldPassword);
    if (!valid) {
      throw new ValidationError("A palavra-passe antiga está incorreta.", 422);
    }

    await UserModel.update(userDb.id, { password: data.newPassword });

    return true;
  }

  static async me(user: any): Promise<any> {
    return await UserModel.findOneBy("username", user.username);
  }

}
