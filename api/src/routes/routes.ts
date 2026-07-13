/*
 *  Tecnobra — Sistema inteligente de gestão de obras
 *  Registo de rotas da API.
 */

import type { FastifyInstance } from "fastify";
import { defaultRateLimit } from "../utils/ratelimite";
import { AuthSchema, CommonSchema, MyAccountSchema } from "../schema/index";
import { AuthController } from "../controllers/AuthController";
import { MyAccountController } from "../controllers/MyAccountController";
import { BaseCrudController } from "../controllers/BaseCrudController";
import { UsersSchema } from "../schema/UsersSchema";
import { UsersController } from "../controllers/UsersController";
import { ConfigController } from "../controllers/ConfigController";
import { requireSystemRule } from "../middlewares/system.guard";
import { ProfileController } from "../controllers/ProfileController";
import { InsightsController } from "../controllers/InsightsController";
import { SavedAnalysesController } from "../controllers/SavedAnalysesController";
import { EventController } from "../controllers/EventController";
import { NotificationTemplateController } from "../controllers/NotificationTemplateController";
import { NotificationTemplateSchema } from "../schema/NotificationTemplateSchema";
import { UploadService } from "../services/UploadService";

type CrudMethods = "index" | "store" | "show" | "update" | "delete";

export class Routes {
    static registerAll(fastify: FastifyInstance) {
        this.socket(fastify);
        this.status(fastify);
        this.auth(fastify);
        this.myAccount(fastify);
        this.configs(fastify);
        this.uploads(fastify);
        this.crud(fastify, "users", new UsersController(), UsersSchema, null, "users");
        this.notifications(fastify);
        this.insights(fastify);
        this.profiles(fastify);
        this.savedAnalyses(fastify);
        this.usersPermissions(fastify);
        fastify.post('/api/v1/users/:id/reset-password', { preHandler: [requireSystemRule(fastify, 'users')] }, UsersController.resetPassword);
    }

    static crud(
        fastify: FastifyInstance,
        prefix: string,
        controller: BaseCrudController<any>,
        schema?: Partial<Record<CrudMethods, any>> & { pagination?: any },
        options?: { only?: CrudMethods[]; except?: CrudMethods[] },
        systemRule?: string
    ) {
        const base = `/api/v1/${prefix}`;
        const allow = (method: CrudMethods) => {
            if (options?.only) return options.only.includes(method);
            if (options?.except) return !options.except.includes(method);
            return true;
        };

        const guards = systemRule
            ? [requireSystemRule(fastify, systemRule)]
            : [fastify.authenticate]

        if (allow("index"))
            fastify.get(base, { preHandler: guards, schema: schema?.pagination ?? CommonSchema.paginationRequest }, controller.index);

        if (allow("store"))
            fastify.post(base, { preHandler: guards, schema: schema?.store ?? {} }, controller.store);

        if (allow("show"))
            fastify.get(`${base}/:id`, { preHandler: guards, schema: schema?.show ?? CommonSchema.customShow }, controller.show);

        if (allow("update"))
            fastify.put(`${base}/:id`, { preHandler: guards, schema: schema?.update ?? schema?.store ?? {} }, controller.update);

        if (allow("delete"))
            fastify.delete(`${base}/:id`, { preHandler: guards }, controller.delete);
    }

    static notifications(fastify: FastifyInstance) {
        const controller = new NotificationTemplateController();
        const guard = [requireSystemRule(fastify, "configs")];
        // Rotas específicas (estáticas — Fastify dá-lhes prioridade sobre /:id)
        fastify.get("/api/v1/notification-templates/catalog", { preHandler: guard }, controller.catalog);
        fastify.post("/api/v1/notification-templates/preview", { preHandler: guard, schema: NotificationTemplateSchema.preview }, controller.preview);
        fastify.post("/api/v1/notification-templates/test", { preHandler: guard, schema: NotificationTemplateSchema.test }, controller.test);
        // CRUD
        this.crud(fastify, "notification-templates", controller, NotificationTemplateSchema, null, "configs");
    }

    static insights(fastify: FastifyInstance) {
        fastify.post("/api/v1/insights",         { preHandler: [requireSystemRule(fastify, "reports")] }, InsightsController.generate);
        fastify.post("/api/v1/insights/cards",   { preHandler: [requireSystemRule(fastify, "reports")] }, InsightsController.cards);
        fastify.post("/api/v1/insights/chat",    { preHandler: [requireSystemRule(fastify, "reports")] }, InsightsController.chat);
        fastify.post("/api/v1/insights/compare", { preHandler: [requireSystemRule(fastify, "reports")] }, InsightsController.compare);
    }

    static configs(fastify: FastifyInstance) {
        fastify.get("/api/v1/config",  { preHandler: [requireSystemRule(fastify, "configs")] }, ConfigController.getConfig);
        fastify.post("/api/v1/config", { preHandler: [requireSystemRule(fastify, "configs")] }, ConfigController.setConfig);
        fastify.get("/api/v1/events",              { preHandler: [requireSystemRule(fastify, "configs")] }, EventController.index);
        fastify.post("/api/v1/events/:id/retry",   { preHandler: [requireSystemRule(fastify, "configs")] }, EventController.retry);
        fastify.post("/api/v1/events/:id/execute", { preHandler: [requireSystemRule(fastify, "configs")] }, EventController.execute);
    }

    static uploads(fastify: FastifyInstance) {
        // Serve ficheiros carregados (fotos, documentos de guias, etc.)
        fastify.get("/uploads/:subdir/:filename", UploadService.serve);
    }

    static auth(fastify: FastifyInstance) {
        fastify.post(
            "/api/central/auth/login",
            { schema: AuthSchema.login, config: { rateLimit: defaultRateLimit(7, "1m") } },
            AuthController.login
        );
        fastify.post(
            "/api/central/auth/check-phone",
            {
                schema: AuthSchema.checkPhone,
                config: {
                    rateLimit: {
                        max: 3, timeWindow: "1m",
                        keyGenerator: (req) => req.ip,
                        errorResponseBuilder: () => ({ message: "Demasiados pedidos, aguarde 1 minuto." }),
                    },
                },
            },
            AuthController.checkPhone
        );
        fastify.post(
            "/api/central/auth/verify-code",
            {
                schema: AuthSchema.verifyCode,
                config: {
                    rateLimit: {
                        max: 5, timeWindow: "5m",
                        keyGenerator: (req) => req.ip,
                        errorResponseBuilder: () => ({ message: "Demasiadas tentativas, aguarde alguns minutos." }),
                    },
                },
            },
            AuthController.verifyCode
        );
        fastify.post(
            "/api/central/auth/reset-password",
            {
                schema: AuthSchema.resetPassword,
                config: {
                    rateLimit: {
                        max: 3, timeWindow: "10m",
                        keyGenerator: (req) => req.ip,
                        errorResponseBuilder: () => ({ message: "Demasiados pedidos, aguarde alguns minutos." }),
                    },
                },
            },
            AuthController.resetPassword
        );
    }

    static myAccount(fastify: FastifyInstance) {
        fastify.get("/api/central/my-account/me",               { preHandler: [fastify.authenticate] },                                         MyAccountController.me);
        fastify.post("/api/central/my-account/update-user",     { preHandler: [fastify.authenticate], schema: MyAccountSchema.updateUser },     MyAccountController.updateUser);
        fastify.post("/api/central/my-account/update-phone",    { preHandler: [fastify.authenticate], schema: MyAccountSchema.updatePhone },    MyAccountController.updatePhone);
        fastify.post("/api/central/my-account/update-password", { preHandler: [fastify.authenticate], schema: MyAccountSchema.updatePassword }, MyAccountController.updatePassword);
    }

    static status(fastify: FastifyInstance) {
        fastify.get("/api/v1/status", { config: { rateLimit: { max: 99999, timeWindow: "1m" } } }, async (req, reply) => {
            reply.send({ status: "ok" });
        });
    }

    static profiles(fastify: FastifyInstance) {
        const profileController = new ProfileController();
        const guards = [requireSystemRule(fastify, "users")];
        const base = "/api/v1/profiles";

        fastify.get(base,                          { preHandler: guards }, profileController.index);
        fastify.post(base,                         { preHandler: guards }, profileController.store);
        fastify.get(`${base}/:id`,                 { preHandler: guards }, ProfileController.getWithRules);
        fastify.put(`${base}/:id`,                 { preHandler: guards }, profileController.update);
        fastify.delete(`${base}/:id`,              { preHandler: guards }, profileController.delete);
        fastify.post(`${base}/:id/rules`,          { preHandler: guards }, ProfileController.addRule);
        fastify.put(`${base}/:id/rules`,           { preHandler: guards }, ProfileController.setRules);
        fastify.delete(`${base}/:id/rules/:rule`,  { preHandler: guards }, ProfileController.removeRule);
    }

    static usersPermissions(fastify: FastifyInstance) {
        const guards = [requireSystemRule(fastify, "users")];

        fastify.get("/api/v1/users/:userId/permissions",            { preHandler: guards }, ProfileController.getUserPermissions);
        fastify.get("/api/v1/users/:userId/profiles",               { preHandler: guards }, ProfileController.getUserProfiles);
        fastify.post("/api/v1/users/:userId/profiles",              { preHandler: guards }, ProfileController.assignToUser);
        fastify.delete("/api/v1/users/:userId/profiles/:profileId", { preHandler: guards }, ProfileController.removeFromUser);
        fastify.get("/api/v1/users/:userId/rules",                  { preHandler: guards }, ProfileController.getUserRules);
        fastify.post("/api/v1/users/:userId/rules",                 { preHandler: guards }, ProfileController.addUserRule);
        fastify.put("/api/v1/users/:userId/rules",                  { preHandler: guards }, ProfileController.setUserRules);
        fastify.delete("/api/v1/users/:userId/rules/:rule",         { preHandler: guards }, ProfileController.removeUserRule);
    }

    static savedAnalyses(fastify: FastifyInstance) {
        const guards = [requireSystemRule(fastify, "reports")];
        const base = "/api/v1/saved-analyses";

        fastify.get(base,          { preHandler: guards }, SavedAnalysesController.index);
        fastify.post(base,         { preHandler: guards }, SavedAnalysesController.store);
        fastify.get(`${base}/:id`, { preHandler: guards }, SavedAnalysesController.show);
        fastify.delete(`${base}/:id`, { preHandler: guards }, SavedAnalysesController.destroy);
    }

    static socket(fastify: FastifyInstance) {
        // Hook interno (localhost) para processos externos (workers, schedules)
        // empurrarem eventos para salas do Socket.IO: { room, event, payload }
        fastify.post("/snotify", async (req, res) => {
            const ip = req.ip || (req.socket as any)?.remoteAddress;
            if (ip !== "127.0.0.1" && ip !== "::1" && ip !== "::ffff:127.0.0.1") {
                return res.code(403).send({ error: "Forbidden" });
            }
            const { room, event, payload } = req.body as any
            if (!room || !event) return res.code(400).send({ error: "room e event são obrigatórios" })
            fastify.io.to(String(room)).emit(String(event), payload ?? {})
            res.send({ ok: true })
        })
    }
}
