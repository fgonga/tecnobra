import {Thinkific, ThinkificClient} from "@bit/thinkificts/Thinkific";
import {db} from "../db/db";
import {Course, CourseModel} from "../models/course.model";
import {ITBundle, ITCourse, ITProduct} from "@bit/thinkificts/types";
import {BaseCrudService} from "./BaseCrudService";
import {configCache} from "./ConfigCache";
import {config} from "../config/env";
import {EventService} from "./EventService";

export interface SyncManifestProduct {
  product_id: string
  slug: string
  name: string
  description: string | null
  price: number
  days_until_expiry: number
  productable_type: string
  productable_id: number
}

export interface SyncItemResult {
  slug: string
  name: string
  thinkific_type: "Course" | "Bundle"
  status: "created" | "updated"
}

export class CoursesService extends BaseCrudService<typeof CourseModel> {
  constructor() {
    super(CourseModel)
  }

  async update(id: number, data: any): Promise<boolean> {
    const result = await super.update(id, data)
    await EventService.processEvent({ type: "course_update", data: { courseId: id } })
    return result
  }

  /**
   * Produto do catálogo Thinkific num formato leve, suficiente para criar/atualizar
   * um curso local sem voltar a bater no /products. É o que o "manifesto" devolve
   * e o que o frontend reenvia por item no /sync/item.
   */
  static toManifestProduct(p: any): SyncManifestProduct {
    return {
      product_id: String(p.id),
      slug: p.slug,
      name: p.name,
      description: p.description ?? null,
      price: Number(p?.price || 0),
      days_until_expiry: Number(p?.days_until_expiry || 0),
      productable_type: p.productable_type,
      productable_id: p.productable_id,
    }
  }

  /**
   * Repete uma chamada ao Thinkific em erros transitórios (rede, 429, 5xx) com
   * backoff exponencial. Erros de cliente (4xx != 429) não são repetidos.
   */
  private static async withRetry<T>(fn: () => Promise<T>, label: string, retries = 3): Promise<T> {
    let lastErr: any
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn()
      } catch (err: any) {
        lastErr = err
        const status = err?.response?.status
        const retriable = !err?.response || status === 429 || (status >= 500 && status <= 599)
        if (!retriable || attempt === retries) break
        const retryAfter = Number(err?.response?.headers?.["retry-after"])
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt
        console.warn(`[CoursesSync] ${label} falhou (${status ?? "rede"}), retry ${attempt + 1}/${retries} em ${delay}ms`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
    throw lastErr
  }

  /**
   * Pagina todo o catálogo /products do Thinkific e devolve a lista leve.
   * Rápido (N/100 requests) — sem os detalhes de course/bundle, que ficam para o /sync/item.
   */
  static async syncManifest(): Promise<SyncManifestProduct[]> {
    let page = 1
    const limit = 100
    const products: any[] = []
    while (true) {
      const resp = await this.withRetry(() => Thinkific.getProducts(page, limit), `getProducts p${page}`)
      products.push(...(resp.items || []))
      if (!resp.meta?.pagination?.next_page) break
      page = resp.meta.pagination.next_page
    }
    return products.map((p) => this.toManifestProduct(p))
  }

  /**
   * Sincroniza UM produto: busca o detalhe do Course/Bundle e faz upsert por slug.
   * Cada chamada usa a sua própria connection (libertada no fim) — sem leaks.
   * Não sobrescreve campos editados localmente (name/price/description/imagem) em updates.
   */
  static async syncItem(product: SyncManifestProduct): Promise<SyncItemResult> {
    const connection = await db.getConnection()
    try {
      let relation: ITCourse | ITBundle | null = null
      let type: "Course" | "Bundle"
      if (product.productable_type === "Course") {
        type = "Course"
        relation = (await this.withRetry(
          () => Thinkific.getCourse(Number(product.productable_id)),
          `getCourse ${product.productable_id}`,
        )) as ITCourse
      } else if (product.productable_type === "Bundle") {
        type = "Bundle"
        relation = (await this.withRetry(
          () => Thinkific.getBundle(Number(product.productable_id)),
          `getBundle ${product.productable_id}`,
        )) as ITBundle
      } else {
        throw new Error(`Tipo de produto não suportado: ${product.productable_type}`)
      }

      // Campos que só o Thinkific define (sempre sobrescrever na sync)
      const syncData = {
        slug: product.slug,
        product_id: String(product.product_id),
        thinkific_id: type === "Course" ? (relation as ITCourse).id : product.productable_id,
        thinkific_type: type,
      }

      const existing = await CourseModel.findOneBy("slug", product.slug)
      let status: "created" | "updated"
      if (!existing) {
        // Novo curso: preencher todos os campos incluindo os editáveis
        const created = await CourseModel.create(
          {
            ...syncData,
            name: product.name,
            course_card_image_url:
              type === "Course"
                ? (relation as ITCourse).course_card_image_url
                : (relation as ITBundle).bundle_card_image_url,
            description: product.description ?? null,
            price: Number(product.price || 0),
            days_until_expiry: Number(product.days_until_expiry || 0),
          },
          connection,
        )
        await EventService.processEvent({ type: "course_update", data: { courseId: created.insertId } })
        status = "created"
      } else {
        // Curso existente: só atualizar campos de sincronização (não sobrescrever edições locais)
        await CourseModel.updateBySlug(product.slug, syncData, connection)
        await EventService.processEvent({ type: "course_update", data: { courseId: existing.id } })
        status = "updated"
      }
      return { slug: product.slug, name: product.name, thinkific_type: type, status }
    } finally {
      connection.release()
    }
  }

  /**
   * Apaga cursos locais que já não existem no catálogo remoto.
   * `seenSlugs` = TODOS os slugs vistos no manifesto (mesmo os que falharam a sincronizar
   * neste run) — para nunca apagar um curso que existe remotamente mas só falhou agora.
   */
  static async finalize(seenSlugs: string[]): Promise<{ deleted: string[] }> {
    const connection = await db.getConnection()
    try {
      const seen = new Set(seenSlugs)
      const [localRows]: any[] = await connection.query(`SELECT id, slug FROM courses`)
      const toDelete = (localRows || []).filter((c: any) => !seen.has(c.slug))
      for (const course of toDelete) {
        await connection.execute(`DELETE FROM courses WHERE slug = ?`, [course.slug])
      }
      return { deleted: toDelete.map((c: any) => c.slug) }
    } finally {
      connection.release()
    }
  }

  /**
   * Sincroniza um único curso pelo seu slug (usado no modal "Adicionar").
   * Devolve null se nenhum produto com esse slug existir no Thinkific.
   */
  static async syncOne(slug: string): Promise<SyncItemResult | null> {
    const products = await this.syncManifest()
    const product = products.find((p) => p.slug === slug)
    if (!product) return null
    return this.syncItem(product)
  }

  /**
   * Sync completa num só passo (fallback / uso programático).
   * O fluxo interativo com progresso usa syncManifest + syncItem + finalize a partir do frontend.
   */
  static async synchronize(): Promise<boolean> {
    const products = await this.syncManifest()
    for (const product of products) {
      await this.syncItem(product)
    }
    await this.finalize(products.map((p) => p.slug))
    return true
  }
  static async defaultCourse(): Promise<Course>{
    const config = await configCache.get();
    if (config?.default_course_id) {
      const course = await CourseModel.findOneBy("id", config.default_course_id);
      if (course) return course;
    }
    throw new Error("Curso padrão não configurado. Defina um curso padrão nas Configurações.");
  }
  static async findDefault(courseSlug?: string | number | null): Promise<Course> {
    if (courseSlug == null) return this.defaultCourse()
    let course = await CourseModel.findOneBy("slug",  courseSlug);
    if (course) return course;
    course = await CourseModel.findOneBy("thinkific_id", courseSlug);
    if (course) return course;
    throw new Error("Curso não encontrado");
  }

  /**
   * Cursos recomendados para o fim do teste de nível (consumido pelo sistema de
   * teste através de uma rota pública). O produto âncora "+Inglês" vem sempre
   * em primeiro lugar e marcado como destaque.
   *
   * Filtragem por nível: cursos etiquetados em `cefr_levels` só aparecem no(s)
   * nível(is) correspondente(s); o produto âncora "+Inglês" e cursos sem
   * etiqueta são gerais (aparecem em todos os níveis).
   */
  static async recommendForLevel(level?: string): Promise<any[]> {
    const [rows]: any[] = await db.query(`SELECT * FROM courses ORDER BY price ASC`)

    const siteBase = (
      process.env.COURSES_SITE_URL ||
      config.server.frontendUrl ||
      config.server.url ||
      ""
    ).replace(/\/$/, "")

    const wanted = (level || "").toUpperCase()

    // Âncora +Inglês: o programa/bundle "+Inglês" especificamente (não qualquer
    // curso que tenha "inglês" no nome).
    const isAnchor = (c: any) =>
      c.slug === "bundlemaisingles" || /programa\s*\+?\s*ingl[eê]s/i.test(c.name ?? "")

    // Normaliza o campo JSON `cefr_levels` (string, array ou null) num array de códigos.
    const parseLevels = (v: any): string[] => {
      if (!v) return []
      try {
        const arr = typeof v === "string" ? JSON.parse(v) : v
        return Array.isArray(arr) ? arr.map((x) => String(x).toUpperCase()) : []
      } catch {
        return []
      }
    }

    // Recomenda apenas: o âncora +Inglês (sempre) + cursos explicitamente
    // etiquetados para o nível pedido. Cursos sem etiqueta não aparecem
    // automaticamente (evita despejar o catálogo inteiro).
    const filtered = (rows || []).filter((c: any) => {
      if (isAnchor(c)) return true
      if (!wanted) return false
      return parseLevels(c.cefr_levels).includes(wanted)
    })

    const shaped = filtered.map((c: any) => ({
      key: c.slug || String(c.id),
      title: c.name,
      description: c.description ?? "",
      price: c.price ?? 0,
      image: c.course_card_image_url ?? "",
      url: c.slug && siteBase ? `${siteBase}/${c.slug}` : siteBase,
      highlight: isAnchor(c),
    }))

    // +Inglês (âncora) sempre primeiro; limita a um número razoável de cartões.
    shaped.sort((a, b) => Number(b.highlight) - Number(a.highlight))
    return shaped.slice(0, 8)
  }

}



