import { ProfileModel } from "../models/profile.model";
import { BaseCrudService } from "./BaseCrudService";

export class ProfileService extends BaseCrudService<typeof ProfileModel> {
  constructor() {
    super(ProfileModel);
  }

  async index(data: any): Promise<any> {
    return ProfileModel.paginateWithRules(data);
  }

  async getRules(profileId: number) { return ProfileModel.getRules(profileId); }
  async addRule(profileId: number, rule: string) { return ProfileModel.addRule(profileId, rule); }
  async removeRule(profileId: number, rule: string) { return ProfileModel.removeRule(profileId, rule); }
  async setRules(profileId: number, rules: string[]) { return ProfileModel.setRules(profileId, rules); }
  async getWithRules(profileId: number) { return ProfileModel.getWithRules(profileId); }

  async getUserProfiles(userId: number) { return ProfileModel.getUserProfiles(userId); }
  async assignToUser(userId: number, profileId: number) { return ProfileModel.assignToUser(userId, profileId); }
  async removeFromUser(userId: number, profileId: number) { return ProfileModel.removeFromUser(userId, profileId); }

  async getUserIndividualRules(userId: number) { return ProfileModel.getUserIndividualRules(userId); }
  async addUserRule(userId: number, rule: string) { return ProfileModel.addUserRule(userId, rule); }
  async removeUserRule(userId: number, rule: string) { return ProfileModel.removeUserRule(userId, rule); }
  async setUserRules(userId: number, rules: string[]) { return ProfileModel.setUserRules(userId, rules); }

  async getUserPermissions(userId: number) { return ProfileModel.getUserPermissions(userId); }
}
