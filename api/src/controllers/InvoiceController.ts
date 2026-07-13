/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Faturação eletrónica (Vendus) — emitir, conectar, anular, PDF, e mapear cursos.
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import { handleControllerError } from "../exceptions/handleControllerError";
import { InvoiceService } from "../services/InvoiceService";
import { VendusError } from "../lib/vendus";

/** Erros do Vendus chegam ao cliente com a mensagem real do provider. */
function fail(reply: FastifyReply, err: any) {
    if (err instanceof VendusError) {
        return reply.code(err.status && err.status >= 400 ? err.status : 422).send({
            type: "danger",
            message: err.message || "Erro na comunicação com o Vendus.",
            errors: err.errors,
        });
    }
    return handleControllerError(reply, err);
}

export class InvoiceController {
    /** GET /invoices — documentos emitidos/conectados. */
    static index = async (req: FastifyRequest, reply: FastifyReply) => {
        try { reply.send(await InvoiceService.list(req.query)); }
        catch (err) { fail(reply, err); }
    };

    /** GET /invoices/pending — encomendas por faturar. */
    static pending = async (req: FastifyRequest, reply: FastifyReply) => {
        try { reply.send(await InvoiceService.pendingOrders(req.query)); }
        catch (err) { fail(reply, err); }
    };

    /** POST /invoices/emit — emite documento para { order_id, type?, client?, notes?, send_email? }. */
    static emit = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = (req.body as any) || {};
            const userId = (req as any).user?.id;
            const invoice = await InvoiceService.emitForOrder(Number(body.order_id), body, userId);
            reply.send({ success: true, invoice });
        } catch (err) { fail(reply, err); }
    };

    /** POST /invoices/connect — liga doc existente { order_id, provider?, vendusId?, external_id?, number?, type?, amount? }. */
    static connect = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = (req.body as any) || {};
            const userId = (req as any).user?.id;
            const invoice = await InvoiceService.connectExisting(Number(body.order_id), body, userId);
            reply.send({ success: true, invoice });
        } catch (err) { fail(reply, err); }
    };

    /** POST /invoices/:id/cancel — anula. */
    static cancel = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = req.params as any;
            const { reason } = (req.body as any) || {};
            reply.send({ success: true, invoice: await InvoiceService.cancel(Number(id), reason) });
        } catch (err) { fail(reply, err); }
    };

    /** GET /invoices/:id/pdf — devolve { url }. */
    static pdf = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = req.params as any;
            reply.send({ url: await InvoiceService.pdfUrl(Number(id)) });
        } catch (err) { fail(reply, err); }
    };

    /** GET /invoices/vendus/search — pesquisa documentos no Vendus (modal Conectar). */
    static searchVendus = async (req: FastifyRequest, reply: FastifyReply) => {
        try { reply.send({ data: await InvoiceService.searchVendus(req.query) }); }
        catch (err) { fail(reply, err); }
    };

    /** GET /invoices/vendus/clients — pesquisa clientes no Vendus. */
    static searchClients = async (req: FastifyRequest, reply: FastifyReply) => {
        try { reply.send({ data: await InvoiceService.searchClients(req.query) }); }
        catch (err) { fail(reply, err); }
    };

    /** GET /invoices/vendus/products — pesquisa produtos no Vendus (tab Cursos). */
    static searchProducts = async (req: FastifyRequest, reply: FastifyReply) => {
        try { reply.send({ data: await InvoiceService.searchProducts(req.query) }); }
        catch (err) { fail(reply, err); }
    };

    /** GET /invoices/courses — cursos + estado de ligação ao Vendus. */
    static courses = async (_req: FastifyRequest, reply: FastifyReply) => {
        try { reply.send({ data: await InvoiceService.coursesForMapping() }); }
        catch (err) { fail(reply, err); }
    };

    /** POST /invoices/courses/:id/connect — liga curso a produto Vendus { vendus_product_id }. */
    static connectCourse = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = req.params as any;
            const { vendus_product_id, vendus_product_name } = (req.body as any) || {};
            const course = await InvoiceService.connectCourseProduct(Number(id), vendus_product_id ?? null, vendus_product_name ?? null);
            reply.send({ success: true, course });
        } catch (err) { fail(reply, err); }
    };

    /** GET /invoices/payment-methods — métodos locais + estado de ligação ao Vendus. */
    static paymentMethods = async (_req: FastifyRequest, reply: FastifyReply) => {
        try { reply.send({ data: await InvoiceService.paymentMethodsForMapping() }); }
        catch (err) { fail(reply, err); }
    };

    /** GET /invoices/vendus/payment-methods — métodos de pagamento da conta Vendus. */
    static searchPaymentMethods = async (_req: FastifyRequest, reply: FastifyReply) => {
        try { reply.send({ data: await InvoiceService.vendusPaymentMethods() }); }
        catch (err) { fail(reply, err); }
    };

    /** POST /invoices/vendus/payment-methods — cria um método na conta Vendus { title, type }. */
    static createPaymentMethod = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = (req.body as any) || {};
            const method = await InvoiceService.createVendusPaymentMethod(body);
            reply.send({ success: true, method });
        } catch (err) { fail(reply, err); }
    };

    /** POST /invoices/payment-methods/:key/connect — liga método local a método Vendus { vendus_id }. */
    static connectPaymentMethod = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { key } = req.params as any;
            const { vendus_id, vendus_name } = (req.body as any) || {};
            const method = await InvoiceService.connectPaymentMethod(String(key), vendus_id ?? null, vendus_name ?? null);
            reply.send({ success: true, method });
        } catch (err) { fail(reply, err); }
    };
}
