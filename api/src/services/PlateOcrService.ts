/*
 *  Tecnobra — OCR de matrículas com Claude (visão).
 *
 *  Recebe uma foto (data-URL base64), envia como bloco de imagem e pede
 *  saída estruturada { matricula, confianca }. O resultado pré-preenche o
 *  formulário na portaria — a confirmação é sempre humana.
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env";
import { ValidationError } from "../exceptions/ValidationError";

const MODEL = "claude-sonnet-5";

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp"] as const;

export type PlateOcrResult = {
  matricula: string | null;
  confianca: number; // 0..1
  observacao?: string | null;
};

export class PlateOcrService {
  static isConfigured(): boolean {
    return Boolean(config.anthropic.apiKey);
  }

  static async readPlate(fotoDataUrl: string): Promise<PlateOcrResult> {
    if (!this.isConfigured()) {
      throw new ValidationError(
        "OCR indisponível (ANTHROPIC_API_KEY não configurada) — introduza a matrícula manualmente.",
        422, "warning"
      );
    }

    const match = String(fotoDataUrl ?? "").match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new ValidationError("Foto inválida — envie uma imagem em base64 (data-URL).", 422, "danger");
    }
    const mediaType = match[1] as (typeof ALLOWED_MEDIA)[number];
    if (!ALLOWED_MEDIA.includes(mediaType)) {
      throw new ValidationError("Formato de imagem não suportado (use JPEG, PNG ou WebP).", 422, "danger");
    }

    const client = new Anthropic({ apiKey: config.anthropic.apiKey });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      thinking: { type: "disabled" },
      // Saída estruturada garante JSON válido no primeiro bloco de texto
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              matricula: {
                type: ["string", "null"],
                description: "A matrícula lida, em maiúsculas, com hífens (ex.: LD-23-45-AB). null se ilegível.",
              },
              confianca: {
                type: "number",
                description: "Confiança na leitura, entre 0 e 1.",
              },
              observacao: {
                type: ["string", "null"],
                description: "Nota curta se a leitura for parcial ou duvidosa.",
              },
            },
            required: ["matricula", "confianca"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: match[2] },
            },
            {
              type: "text",
              text:
                "Lê a matrícula do veículo nesta fotografia. " +
                "Devolve a matrícula exatamente como está na chapa, em maiúsculas. " +
                "Se não conseguires ler com segurança, devolve matricula: null e explica em observacao.",
            },
          ],
        },
      ],
    } as any);

    const textBlock: any = (response.content as any[]).find((b) => b.type === "text");
    if (!textBlock?.text) {
      throw new ValidationError("O OCR não devolveu resultado — tente outra foto.", 422, "warning");
    }

    let parsed: PlateOcrResult;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      // Fallback: extrai o primeiro objeto JSON do texto
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new ValidationError("Resposta do OCR ilegível — introduza a matrícula manualmente.", 422, "warning");
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    return {
      matricula: parsed.matricula ? String(parsed.matricula).toUpperCase().trim() : null,
      confianca: Math.max(0, Math.min(1, Number(parsed.confianca ?? 0))),
      observacao: parsed.observacao ?? null,
    };
  }
}
