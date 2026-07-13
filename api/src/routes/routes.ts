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

import type { FastifyInstance } from "fastify";
import { config } from "../config/env";
import { defaultRateLimit } from "../utils/ratelimite";
import {AuthSchema, CheckoutSchema, CommonSchema, MyAccountSchema} from "../schema/index";
import { CheckoutController } from "../controllers/CheckoutController";
import { WebHookController } from "../controllers/WebHookController";
import { AuthController } from "../controllers/AuthController";
import { MyAccountController } from "../controllers/MyAccountController";
import {CoursesController} from "../controllers/CoursesController";
import {CouponsController} from "../controllers/CouponsController";
import {CouponsSchema} from "../schema/CouponsSchema";
import {BaseCrudController} from "../controllers/BaseCrudController";
import {UsersSchema} from "../schema/UsersSchema";
import {UsersController} from "../controllers/UsersController";
import {ReportController} from "../controllers/ReportController";
import {PaymentsController} from "../controllers/PaymentsController";
import {PaymentsSchema} from "../schema/PaymentsSchema";
import {OrdersController} from "../controllers/OrdersController";
import {OrdersSchema} from "../schema/OrdersSchema";
import {ConfigController} from "../controllers/ConfigController";
import {UtilController} from "../controllers/UtilController";
import {requireSystemRule} from "../middlewares/system.guard";
import {PlaygroundController} from "../controllers/PlaygroundController";
import {InvoiceController} from "../controllers/InvoiceController";
import io from "../../socket-server";
import {InfluencersController} from "../controllers/InfluencersController";
import {InfluencersSchema} from "../schema/InfluencersSchema";
import {RefundController} from "../controllers/RefundController";
import {SettlementController} from "../controllers/SettlementController";
import {ProfileController} from "../controllers/ProfileController";
import {InsightsController} from "../controllers/InsightsController";
import {SavedAnalysesController} from "../controllers/SavedAnalysesController";
import {RecoveryController} from "../controllers/RecoveryController"
import {EventController} from "../controllers/EventController";
import {HelpdeskController} from "../controllers/HelpdeskController";
import {NotificationTemplateController} from "../controllers/NotificationTemplateController";
import {NotificationTemplateSchema} from "../schema/NotificationTemplateSchema";
type CrudMethods = "index" | "store" | "show" | "update" | "delete";
export class Routes {
    static registerAll(fastify: FastifyInstance) {
        this.socket(fastify);
        this.status(fastify);
        this.checkout(fastify);
        this.webhook(fastify);
        this.auth(fastify);
        this.myAccount(fastify);
        this.courses(fastify);
        this.report(fastify);
        this.configs(fastify);
        this.utils(fastify);
        this.crud(fastify, "coupons", new CouponsController(),  CouponsSchema, null,"coupons" );
        this.crud(fastify, "users", new UsersController(), UsersSchema, null, "users");
        this.crud(fastify, "influencers", new InfluencersController(), InfluencersSchema, null, "influencers");
        this.crud(fastify, "payments", new PaymentsController(), PaymentsSchema, null, "payments");
        this.crud(fastify, "orders", new OrdersController(), OrdersSchema, null, "orders");
        this.crud(fastify, "courses", new CoursesController(), null, { only: ["index", "show",'update'] }, "courses");
        this.notifications(fastify);
        this.refunds(fastify);
        this.settlements(fastify);
        this.profiles(fastify);
        this.savedAnalyses(fastify);
        this.usersPermissions(fastify);
        this.recovery(fastify);
        this.helpdesk(fastify);
        this.playground(fastify);
        this.invoices(fastify);
        fastify.post('/api/v1/users/:id/reset-password', { preHandler: [requireSystemRule(fastify, 'users')] }, UsersController.resetPassword);
    }

    static playground(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "playground")];
        fastify.get("/api/v1/playground/status", { preHandler: guard }, PlaygroundController.status);
        fastify.post("/api/v1/playground/run",   { preHandler: guard }, PlaygroundController.run);
    }

    static invoices(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "invoices")];
        const base = "/api/v1/invoices";
        fastify.get(base,                          { preHandler: guard }, InvoiceController.index);
        fastify.get(`${base}/pending`,             { preHandler: guard }, InvoiceController.pending);
        fastify.post(`${base}/emit`,               { preHandler: guard }, InvoiceController.emit);
        fastify.post(`${base}/connect`,            { preHandler: guard }, InvoiceController.connect);
        fastify.post(`${base}/:id/cancel`,         { preHandler: guard }, InvoiceController.cancel);
        fastify.get(`${base}/:id/pdf`,             { preHandler: guard }, InvoiceController.pdf);
        // Pesquisas no Vendus (modal Conectar, picker de cliente, tab Cursos)
        fastify.get(`${base}/vendus/search`,       { preHandler: guard }, InvoiceController.searchVendus);
        fastify.get(`${base}/vendus/clients`,      { preHandler: guard }, InvoiceController.searchClients);
        fastify.get(`${base}/vendus/products`,     { preHandler: guard }, InvoiceController.searchProducts);
        // Mapeamento curso -> produto Vendus
        fastify.get(`${base}/courses`,             { preHandler: guard }, InvoiceController.courses);
        fastify.post(`${base}/courses/:id/connect`,{ preHandler: guard }, InvoiceController.connectCourse);
        // Mapeamento método de pagamento local -> método Vendus
        fastify.get(`${base}/payment-methods`,         { preHandler: guard }, InvoiceController.paymentMethods);
        fastify.get(`${base}/vendus/payment-methods`,  { preHandler: guard }, InvoiceController.searchPaymentMethods);
        fastify.post(`${base}/vendus/payment-methods`, { preHandler: guard }, InvoiceController.createPaymentMethod);
        fastify.post(`${base}/payment-methods/:key/connect`, { preHandler: guard }, InvoiceController.connectPaymentMethod);
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
    static checkout(fastify: FastifyInstance) {
        fastify.post(
            "/api/checkout/done",
            {
                schema: CheckoutSchema.checkout,
                config: {
                    rateLimit: {
                        max: 5,
                        timeWindow: "1m",
                        keyGenerator: (req) => req.ip,
                        errorResponseBuilder: () => ({
                            message: "Muitas requisições, aguarde 1 minuto.",
                        }),
                    },
                },
            },
            CheckoutController.done
        );
        fastify.get("/api/checkout/configurations", { config: { rateLimit: defaultRateLimit(7, "1m") } }, CheckoutController.configurations);
        fastify.get("/api/checkout/coupon",     { config: { rateLimit: defaultRateLimit(7, "1m") } }, CheckoutController.coupon);
        fastify.get("/api/checkout/card",       { config: { rateLimit: defaultRateLimit(7, "1m") } }, CheckoutController.card);
        fastify.get("/api/checkout/cart",       { config: { rateLimit: defaultRateLimit(7, "1m") } }, CheckoutController.cart);
        fastify.get("/api/checkout/print",      { config: { rateLimit: defaultRateLimit(7, "1m") } }, CheckoutController.print);
        fastify.get("/api/checkout/payment/check", { config: { rateLimit: defaultRateLimit(7, "1m") } }, CheckoutController.checkPayment);
        // Recomendação pública de cursos para o fim do teste de nível.
        // Caminho propositadamente pouco óbvio (consumido server-to-server pelo sistema de teste).
        fastify.get("/api/checkout/lt-course-picks-3f9c2a", { config: { rateLimit: defaultRateLimit(20, "1m") } }, CoursesController.recommend);
    }
    static recovery(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "orders")];
        fastify.get("/api/v1/recovery/stats",  { preHandler: guard }, RecoveryController.stats);
        fastify.get("/api/v1/recovery/orders", { preHandler: guard }, RecoveryController.orders);
        fastify.post("/api/v1/recovery/send",  { preHandler: guard }, RecoveryController.send);
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
    static helpdesk(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "configs")];
        fastify.post("/api/v1/helpdesk/send-day-resume", { preHandler: guard }, HelpdeskController.sendDayResume);
        fastify.post("/api/v1/helpdesk/reconcile-payments", { preHandler: guard }, HelpdeskController.reconcilePayments);
        fastify.post("/api/v1/helpdesk/apply-reconciliation", { preHandler: guard }, HelpdeskController.applyReconciliation);
    }
    static report(fastify: FastifyInstance) {
        fastify.get("/api/v1/report",                { preHandler: [requireSystemRule(fastify, "reports")] },    ReportController.report);
        fastify.get("/api/v1/report/sales",          { preHandler: [requireSystemRule(fastify, "reports")] },    ReportController.sales);
        fastify.get("/api/v1/report-dashboard",      { preHandler: [requireSystemRule(fastify, "dashboard")] },  ReportController.reportDashboard);
        fastify.post("/api/v1/insights",             { preHandler: [requireSystemRule(fastify, "reports")] },    InsightsController.generate);
        fastify.post("/api/v1/insights/cards",       { preHandler: [requireSystemRule(fastify, "reports")] },    InsightsController.cards);
        fastify.post("/api/v1/insights/chat",        { preHandler: [requireSystemRule(fastify, "reports")] },    InsightsController.chat);
        fastify.post("/api/v1/insights/compare",     { preHandler: [requireSystemRule(fastify, "reports")] },    InsightsController.compare);
    }
    static utils(fastify: FastifyInstance) {
        if (config.isDev) {
            fastify.post("/api/v1/util/dev-aprove-payment", {}, UtilController.devAprovePayment);
            fastify.post("/api/v1/util/dev-recuse-payment", {}, UtilController.devRecusePayment);
        }
    }
    static configs(fastify: FastifyInstance) {
        fastify.get("/api/v1/config",  { preHandler: [requireSystemRule(fastify, "configs")] }, ConfigController.getConfig);
        fastify.post("/api/v1/config", { preHandler: [requireSystemRule(fastify, "configs")] }, ConfigController.setConfig);
fastify.get("/api/v1/events",              { preHandler: [requireSystemRule(fastify, "configs")] }, EventController.index);
        fastify.post("/api/v1/events/:id/retry",   { preHandler: [requireSystemRule(fastify, "configs")] }, EventController.retry);
        fastify.post("/api/v1/events/:id/execute", { preHandler: [requireSystemRule(fastify, "configs")] }, EventController.execute);
    }
    static webhook(fastify: FastifyInstance) {
        fastify.post("/api/webhook-9f2a3b7c9e8d", WebHookController.handle);
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
                        errorResponseBuilder: () => ({ message: "Muitas requisições, aguarde 1 minuto." }),
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
                        errorResponseBuilder: () => ({ message: "Muitas tentativas, aguarde alguns minutos." }),
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
                        errorResponseBuilder: () => ({ message: "Muitas requisições, aguarde alguns minutos." }),
                    },
                },
            },
            AuthController.resetPassword
        );
    }
    static myAccount(fastify: FastifyInstance) {
        fastify.get("/api/central/my-account/me",              { preHandler: [fastify.authenticate] },                                         MyAccountController.me);
        fastify.post("/api/central/my-account/update-user",     { preHandler: [fastify.authenticate], schema: MyAccountSchema.updateUser },     MyAccountController.updateUser);
        fastify.post("/api/central/my-account/update-phone",    { preHandler: [fastify.authenticate], schema: MyAccountSchema.updatePhone },    MyAccountController.updatePhone);
        fastify.post("/api/central/my-account/update-password", { preHandler: [fastify.authenticate], schema: MyAccountSchema.updatePassword }, MyAccountController.updatePassword);
    }
    static courses(fastify: FastifyInstance) {
        const guard = [requireSystemRule(fastify, "courses")];
        fastify.get("/api/v1/courses/synchronize", { preHandler: guard }, CoursesController.synchronize);
        // Fluxo interativo com progresso (curso-a-curso)
        fastify.get("/api/v1/courses/sync/manifest", { preHandler: guard }, CoursesController.syncManifest);
        fastify.post("/api/v1/courses/sync/item", { preHandler: guard }, CoursesController.syncItem);
        fastify.post("/api/v1/courses/sync/finalize", { preHandler: guard }, CoursesController.syncFinalize);
        // Sync de um único curso pelo slug (modal "Adicionar")
        fastify.post("/api/v1/courses/sync/one", { preHandler: guard }, CoursesController.syncOne);
    }
    static status(fastify: FastifyInstance) {
        fastify.get("/api/v1/status", { config: { rateLimit: { max: 99999, timeWindow: "1m" } } }, async (req, reply) => {
            reply.send({ status: "ok" });
        });
    }
    static refunds(fastify: FastifyInstance) {
        const refundController = new RefundController();
        const guards = [requireSystemRule(fastify, "orders")];
        const base = "/api/v1/refunds";

        fastify.get(base,                      { preHandler: guards }, refundController.index);
        fastify.post(base,                     { preHandler: guards }, refundController.store);
        fastify.get(`${base}/:id`,             { preHandler: guards }, refundController.show);
        fastify.put(`${base}/:id`,             { preHandler: guards }, refundController.update);
        fastify.delete(`${base}/:id`,          { preHandler: guards }, refundController.delete);
        fastify.post(`${base}/:id/approve`,    { preHandler: guards }, RefundController.approve);
        fastify.post(`${base}/:id/reject`,     { preHandler: guards }, RefundController.reject);
    }
    static settlements(fastify: FastifyInstance) {
        const settlementController = new SettlementController();
        const guards = [requireSystemRule(fastify, "reports")];
        const base = "/api/v1/settlements";

        fastify.get(base,                      { preHandler: guards }, settlementController.index);
        fastify.post(base,                     { preHandler: guards }, settlementController.store);
        fastify.get(`${base}/balance`,               { preHandler: guards }, SettlementController.balance);
        fastify.post(`${base}/calculate`,            { preHandler: guards }, SettlementController.calculate);
        fastify.post(`${base}/bulk`,                 { preHandler: guards }, SettlementController.bulkCreate);
        fastify.get(`${base}/transactions`,          { preHandler: guards }, SettlementController.transactions);
        fastify.post(`${base}/transactions/manual`, {
            preHandler: guards,
            schema: {
                body: {
                    type: "object",
                    required: ["direction", "account", "amount"],
                    additionalProperties: false,
                    properties: {
                        direction:   { type: "string", enum: ["in", "out"] },
                        account:     { type: "string", enum: ["treesix", "partners"] },
                        amount:      { type: "number", minimum: 0.01, maximum: 1000000 },
                        description: { type: "string", maxLength: 500 },
                    },
                },
            },
        }, SettlementController.addManualTransaction);
        fastify.get(`${base}/:id`,                   { preHandler: guards }, settlementController.show);
        fastify.put(`${base}/:id`,             { preHandler: guards }, settlementController.update);
        fastify.delete(`${base}/:id`,          { preHandler: guards }, settlementController.delete);
        fastify.post(`${base}/:id/mark-paid`,            { preHandler: guards }, SettlementController.markAsPaid);
        fastify.post(`${base}/:id/proofs`,               { preHandler: guards }, SettlementController.addProof);
        fastify.delete(`${base}/:id/proofs/:filename`,   { preHandler: guards }, SettlementController.removeProof);
        fastify.get(`/uploads/proofs/:filename`, SettlementController.serveProof);
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
        fastify.post("/snotify", async (req, res) => {
            const ip = req.ip || (req.socket as any)?.remoteAddress;
            if (ip !== "127.0.0.1" && ip !== "::1" && ip !== "::ffff:127.0.0.1") {
                return res.code(403).send({ error: "Forbidden" });
            }
            const { paymentId, message, success, retryable } = req.body as any
            fastify.io.to(paymentId).emit('payment-update', { paymentId, message, success, retryable })
            res.send({ ok: true })
        })
    }
}
