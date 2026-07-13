import { FastifyRequest, FastifyReply } from "fastify";
import { BaseCrudController } from "./BaseCrudController";
import { ProfileService } from "../services/ProfileService";
import { handleControllerError } from "../exceptions/handleControllerError";

const profileService = new ProfileService();

export class ProfileController extends BaseCrudController<ProfileService> {
  constructor() {
    super(profileService);
  }

  // ─── Profile Rules ─────────────────────────────────────────────────────────

  static addRule = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const { rule } = req.body as any;
      await profileService.addRule(Number(id), rule);
      reply.send({ success: true });
    } catch (err: any) { handleControllerError(reply, err); }
  };

  static removeRule = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id, rule } = req.params as any;
      await profileService.removeRule(Number(id), rule);
      reply.send({ success: true });
    } catch (err: any) { handleControllerError(reply, err); }
  };

  static setRules = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const { rules } = req.body as any;
      await profileService.setRules(Number(id), rules);
      reply.send({ success: true });
    } catch (err: any) { handleControllerError(reply, err); }
  };

  static getWithRules = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const data = await profileService.getWithRules(Number(id));
      reply.send(data);
    } catch (err: any) { handleControllerError(reply, err); }
  };

  // ─── User ↔ Profile ────────────────────────────────────────────────────────

  static getUserProfiles = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = req.params as any;
      const data = await profileService.getUserProfiles(Number(userId));
      reply.send(data);
    } catch (err: any) { handleControllerError(reply, err); }
  };

  static assignToUser = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = req.params as any;
      const { profile_id } = req.body as any;
      await profileService.assignToUser(Number(userId), Number(profile_id));
      reply.send({ success: true });
    } catch (err: any) { handleControllerError(reply, err); }
  };

  static removeFromUser = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, profileId } = req.params as any;
      await profileService.removeFromUser(Number(userId), Number(profileId));
      reply.send({ success: true });
    } catch (err: any) { handleControllerError(reply, err); }
  };

  // ─── User Individual Rules ─────────────────────────────────────────────────

  static getUserRules = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = req.params as any;
      const data = await profileService.getUserIndividualRules(Number(userId));
      reply.send(data);
    } catch (err: any) { handleControllerError(reply, err); }
  };

  static addUserRule = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = req.params as any;
      const { rule } = req.body as any;
      await profileService.addUserRule(Number(userId), rule);
      reply.send({ success: true });
    } catch (err: any) { handleControllerError(reply, err); }
  };

  static removeUserRule = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, rule } = req.params as any;
      await profileService.removeUserRule(Number(userId), rule);
      reply.send({ success: true });
    } catch (err: any) { handleControllerError(reply, err); }
  };

  static setUserRules = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = req.params as any;
      const { rules } = req.body as any;
      await profileService.setUserRules(Number(userId), rules);
      reply.send({ success: true });
    } catch (err: any) { handleControllerError(reply, err); }
  };

  // ─── User Permissions (summary) ────────────────────────────────────────────

  static getUserPermissions = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = req.params as any;
      const data = await profileService.getUserPermissions(Number(userId));
      reply.send(data);
    } catch (err: any) { handleControllerError(reply, err); }
  };
}
