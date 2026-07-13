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
import { requireSystemRule, requireAnySystemRule } from "../middlewares/system.guard";
import { ProfileController } from "../controllers/ProfileController";
import { InsightsController } from "../controllers/InsightsController";
import { SavedAnalysesController } from "../controllers/SavedAnalysesController";
import { EventController } from "../controllers/EventController";
import { NotificationTemplateController } from "../controllers/NotificationTemplateController";
import { NotificationTemplateSchema } from "../schema/NotificationTemplateSchema";
import { UploadService } from "../services/UploadService";
import { ObrasController } from "../controllers/ObrasController";
import { ObrasSchema } from "../schema/ObrasSchema";
import { EmpresasController } from "../controllers/EmpresasController";
import { EmpresasSchema } from "../schema/EmpresasSchema";
import { TrabalhadoresController } from "../controllers/TrabalhadoresController";
import { TrabalhadoresSchema } from "../schema/TrabalhadoresSchema";
import { CardController } from "../controllers/CardController";
import { ScanController } from "../controllers/ScanController";
import { ScanSchema } from "../schema/ScanSchema";
import { MovimentosController } from "../controllers/MovimentosController";
import { DashboardController } from "../controllers/DashboardController";
import { EquipamentosController } from "../controllers/EquipamentosController";
import { EquipamentosSchema } from "../schema/EquipamentosSchema";
import { MateriaisController } from "../controllers/MateriaisController";
import { MateriaisSchema, OrcamentosSchema, GuiasSchema, ConsumosSchema } from "../schema/MateriaisSchema";
import { GuiasController } from "../controllers/GuiasController";
import { ConsumosController } from "../controllers/ConsumosController";
import { OrcamentosController } from "../controllers/OrcamentosController";
import { MovimentosEquipamentoController } from "../controllers/MovimentosEquipamentoController";
import { VisitantesController } from "../controllers/VisitantesController";
import { VeiculosController } from "../controllers/VeiculosController";
import { VisitantesSchema, VeiculosSchema } from "../schema/VisitantesSchema";
import { ReportController } from "../controllers/ReportController";
import { AlertasController } from "../controllers/AlertasController";
import { DesempenhosController, MetricasDesempenhoController } from "../controllers/DesempenhosController";
import { DesempenhosSchema, MetricasDesempenhoSchema } from "../schema/DesempenhosSchema";

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
        this.crud(fastify, "obras", new ObrasController(), ObrasSchema, null, "obras");
        this.crud(fastify, "empresas", new EmpresasController(), EmpresasSchema, null, "empresas");
        this.trabalhadores(fastify);
        this.cards(fastify);
        this.portaria(fastify);
        this.dashboard(fastify);
        this.equipamentos(fastify);
        this.materiais(fastify);
        this.visitantesVeiculos(fastify);
        this.report(fastify);
        this.alertas(fastify);
        this.desempenho(fastify);
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

    static trabalhadores(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "trabalhadores")];
        // Rotas específicas ANTES do CRUD (prioridade sobre /:id)
        fastify.get("/api/v1/trabalhadores/:id/cartao",          { preHandler: guard }, TrabalhadoresController.cartao);
        fastify.post("/api/v1/trabalhadores/:id/emitir-cartao",  { preHandler: guard }, TrabalhadoresController.emitirCartao);
        fastify.post("/api/v1/trabalhadores/:id/revogar-cartao", { preHandler: guard }, TrabalhadoresController.revogarCartao);
        this.crud(fastify, "trabalhadores", new TrabalhadoresController(), TrabalhadoresSchema, null, "trabalhadores");
    }

    static portaria(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "portaria")];
        fastify.post("/api/v1/scan/resolve", { preHandler: guard, schema: ScanSchema.resolve }, ScanController.resolve);
        fastify.post("/api/v1/scan/checkin", { preHandler: guard, schema: ScanSchema.checkin }, ScanController.checkin);
        fastify.get("/api/v1/obras/:id/ocupacao", { preHandler: guard }, ScanController.ocupacao);
        // Histórico de movimentos (leitura)
        this.crud(fastify, "movimentos", new MovimentosController(), null, { only: ["index", "show"] }, "portaria");
    }

    static dashboard(fastify: FastifyInstance) {
        fastify.get("/api/v1/report-dashboard", { preHandler: [requireSystemRule(fastify, "dashboard")] }, DashboardController.dashboard);
    }

    static equipamentos(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "equipamentos")];
        // Rotas específicas ANTES do CRUD
        fastify.post("/api/v1/equipamentos/:id/levantar", { preHandler: guard, schema: EquipamentosSchema.levantar }, EquipamentosController.levantar);
        fastify.post("/api/v1/equipamentos/:id/devolver", { preHandler: guard, schema: EquipamentosSchema.devolver }, EquipamentosController.devolver);
        this.crud(fastify, "equipamentos", new EquipamentosController(), EquipamentosSchema, null, "equipamentos");
        this.crud(fastify, "movimentos-equipamento", new MovimentosEquipamentoController(), null, { only: ["index", "show"] }, "equipamentos");
    }

    static materiais(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "materiais")];
        fastify.get("/api/v1/obras/:id/stock", { preHandler: guard }, MateriaisController.stock);
        this.crud(fastify, "materiais", new MateriaisController(), MateriaisSchema, null, "materiais");
        this.crud(fastify, "orcamentos-materiais", new OrcamentosController(), OrcamentosSchema, null, "materiais");
        this.crud(fastify, "guias-remessa", new GuiasController(), GuiasSchema, { only: ["index", "store", "show"] }, "materiais");
        this.crud(fastify, "consumos-materiais", new ConsumosController(), ConsumosSchema, { only: ["index", "store", "show"] }, "materiais");
    }

    static visitantesVeiculos(fastify: FastifyInstance) {
        this.crud(fastify, "visitantes", new VisitantesController(), VisitantesSchema, null, "visitantes");
        // OCR de matrícula — usado na portaria e no registo de veículos
        fastify.post("/api/v1/veiculos/ocr-matricula", {
            preHandler: [requireAnySystemRule(fastify, ["portaria", "veiculos"])],
            schema: VeiculosSchema.ocr,
        }, VeiculosController.ocrMatricula);
        this.crud(fastify, "veiculos", new VeiculosController(), VeiculosSchema, null, "veiculos");
    }

    static cards(fastify: FastifyInstance) {
        // Cartão digital público — sem auth, rate-limited por IP
        fastify.get("/api/public/cards/:token", {
            config: { rateLimit: defaultRateLimit(30, "1m") },
        }, CardController.show);
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

    static report(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "reports")];
        fastify.get("/api/v1/report/presencas",  { preHandler: guard }, ReportController.presencas);
        fastify.get("/api/v1/report/visitantes", { preHandler: guard }, ReportController.visitantes);
        fastify.get("/api/v1/report/inventario", { preHandler: guard }, ReportController.inventario);
        fastify.get("/api/v1/report/materiais",  { preHandler: guard }, ReportController.materiais);
        fastify.get("/api/v1/report/desempenho", { preHandler: guard }, ReportController.desempenho);
    }

    static alertas(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "alertas")];
        fastify.get("/api/v1/alertas/abertos/contagem", { preHandler: guard }, AlertasController.contagem);
        fastify.post("/api/v1/alertas/:id/resolver",    { preHandler: guard }, AlertasController.resolver);
        this.crud(fastify, "alertas", new AlertasController(), null, { only: ["index", "show"] }, "alertas");
    }

    static desempenho(fastify: FastifyInstance) {
        this.crud(fastify, "metricas-desempenho", new MetricasDesempenhoController(), MetricasDesempenhoSchema, null, "desempenho");
        this.crud(fastify, "desempenhos", new DesempenhosController(), DesempenhosSchema, null, "desempenho");
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
