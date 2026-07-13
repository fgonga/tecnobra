import {UserModel} from "../models/user.model";
import {BaseCrudService} from "./BaseCrudService";
export class UsersService extends BaseCrudService<typeof UserModel> {
  constructor() {
    super(UserModel)
  }

  static async resetPassword(id: number, defaultPassword: string): Promise<void> {
    await UserModel.update(id, { password: defaultPassword });
  }
}
