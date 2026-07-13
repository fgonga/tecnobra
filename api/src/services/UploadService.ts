import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { handleControllerError } from "../exceptions/handleControllerError";

const SAFE_SUBDIR_RE = /^[a-z0-9-]+$/;

const MIME_EXT: Record<string, string> = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/webp": "webp",
    "image/jpeg": "jpg",
};

const EXT_MIME: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
};

/**
 * Armazenamento de ficheiros em disco local a partir de data-URLs base64.
 * Padrão: recebe `data:<mime>;base64,<dados>` no corpo JSON e devolve o
 * caminho relativo `/uploads/<subdir>/<uuid>.<ext>` servido por `serve`.
 */
export class UploadService {
    /** Grava um data-URL em uploads/<subdir> e devolve o caminho relativo, ou null se inválido. */
    static saveDataUrl(dataUrl: string, subdir: string): string | null {
        if (!SAFE_SUBDIR_RE.test(subdir)) return null;
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return null;
        const ext = MIME_EXT[match[1]] ?? "jpg";
        const uploadsDir = join(process.cwd(), "uploads", subdir);
        if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
        const filename = `${crypto.randomUUID()}.${ext}`;
        writeFileSync(join(uploadsDir, filename), Buffer.from(match[2], "base64"));
        return `/uploads/${subdir}/${filename}`;
    }

    /** Resolve o caminho absoluto de um ficheiro, com guarda anti path-traversal. */
    static resolveSafe(subdir: string, filename: string): string | null {
        if (!SAFE_SUBDIR_RE.test(subdir)) return null;
        if (!filename || filename.includes("..") || filename.includes("/")) return null;
        return join(process.cwd(), "uploads", subdir, filename);
    }

    /** Elimina um ficheiro previamente gravado (caminho relativo /uploads/...). */
    static removeByUrl(url: string): void {
        const match = url.match(/^\/uploads\/([a-z0-9-]+)\/([^/]+)$/);
        if (!match) return;
        const filepath = this.resolveSafe(match[1], match[2]);
        if (filepath && existsSync(filepath)) unlinkSync(filepath);
    }

    /** Handler Fastify: GET /uploads/:subdir/:filename */
    static serve = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { subdir, filename } = req.params as any;
            const filepath = UploadService.resolveSafe(subdir, filename);
            if (!filepath) return reply.code(400).send({ message: "Nome de ficheiro inválido." });
            if (!existsSync(filepath)) return reply.code(404).send({ message: "Ficheiro não encontrado." });
            const ext = filename.split(".").pop()?.toLowerCase();
            reply.header("Content-Type", EXT_MIME[ext ?? ""] || "application/octet-stream");
            reply.header("Content-Disposition", `inline; filename="${filename}"`);
            reply.send(readFileSync(filepath));
        } catch (err: any) {
            handleControllerError(reply, err);
        }
    };
}
