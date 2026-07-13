import { db } from "../db/db";

export interface FindOneOptions {
  id: number | string;
  columns?: string[];
  with?: string[]; // nomes de relações opcionais
}

// Regex para validar nomes de colunas — previne SQL injection
const SAFE_COL_RE = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

export abstract class BaseModel {
  static tableName: string;
  // Colunas permitidas em orderBy / filters / searchable (subclasses devem sobrescrever)
  static allowedColumns: string[] = ["id"];
  // Colunas sensíveis que nunca devem ser retornadas via columns[] do request
  static sensitiveColumns: string[] = [];
  // Relações permitidas via ?with[] (subclasses devem sobrescrever)
  static allowedRelations: string[] = [];

  private static getConnection(connection?: any) {
    return connection || db;
  }
  static async query<T = any>(sql: string, params: any[] = [], connection?: any): Promise<T[]> {
    const conn = this.getConnection(connection);
    const [rows] = await conn.query(sql, params);
    return rows as T[];
  }
  static async deleteAllBy(column: string, value: any, connection?: any): Promise<number> {
    if (!SAFE_COL_RE.test(column)) throw new Error(`Invalid column name: ${column}`);
    const conn = this.getConnection(connection);
    const [result]: any = await conn.execute(
        `DELETE FROM ${this.tableName} WHERE ${column} = ?`,
        [value]
    );
    return result.affectedRows || 0;
  }

  static async findOneById<T = any>(
      { id, columns = ["*"], with: withRelations = [] }: FindOneOptions,
      connection?: any
  ): Promise<T | null> {
    if (!id) throw new Error("O campo 'id' é obrigatório.");

    const conn = this.getConnection(connection);

    // Validar e filtrar colunas pedidas: apenas as permitidas e sem colunas sensíveis
    const safeColumns = columns.filter(c =>
      c === "*" || (SAFE_COL_RE.test(c) && !(this as any).sensitiveColumns.includes(c))
    );
    const cols = safeColumns.length ? safeColumns.join(", ") : "*";
    let sql = `SELECT ${cols} FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const params: any[] = [id];

    // suporte simples para eager loading manual
    const [rows] = await conn.execute(sql, params);
    const record = (rows as any[])[0] || null;

    if (!record) return null;

    // Remover colunas sensíveis do resultado
    for (const col of (this as any).sensitiveColumns) {
      delete record[col];
    }

    // carrega relações declaradas no 'with' (apenas as explicitamente permitidas)
    if (withRelations.length) {
      for (const relation of withRelations) {
        if ((this as any).allowedRelations.includes(relation) && typeof (this as any)[relation] === "function") {
          record[relation] = await (this as any)[relation](record, conn);
        }
      }
    }

    return record;
  }

  static async findOneBy(column: string, value: any, connection?: any): Promise<any | null> {
    if (!SAFE_COL_RE.test(column)) throw new Error(`Invalid column name: ${column}`);
    const conn = this.getConnection(connection);
    const [rows] = await conn.execute(
        `SELECT * FROM ${this.tableName} WHERE ${column} = ? LIMIT 1`,
        [value]
    );
    return (rows as any[])[0] || null;
  }

  static async findAllBy(column: string, value: any, connection?: any): Promise<any[]> {
    if (!SAFE_COL_RE.test(column)) throw new Error(`Invalid column name: ${column}`);
    const conn = this.getConnection(connection);
    const [rows] = await conn.execute(
        `SELECT * FROM ${this.tableName} WHERE ${column} = ?`,
        [value]
    );
    return rows as any[];
  }

  static async update(id: string | number, data: Record<string, any>, connection?: any): Promise<boolean> {
    const conn = this.getConnection(connection);
    // Validar chaves contra regex para prevenir injecção de nomes de colunas
    const safeEntries = Object.entries(data).filter(([k]) => SAFE_COL_RE.test(k));
    const columns = safeEntries.map(([k]) => `${k} = ?`).join(", ");
    const values = safeEntries.map(([, v]) => v);
    await conn.execute(`UPDATE ${this.tableName} SET ${columns} WHERE id = ?`, [...values, id]);
    return true;
  }

  static async genericCreate(data: Record<string, any>, connection?: any): Promise<any> {
    const conn = this.getConnection(connection);
    const safeEntries = Object.entries(data).filter(([k]) => SAFE_COL_RE.test(k));
    const columns = safeEntries.map(([k]) => k).join(", ");
    const placeholders = safeEntries.map(() => "?").join(", ");
    const values = safeEntries.map(([, v]) => v);
    const [result]: any = await conn.execute(
        `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
        values
    );
    return { id: result.insertId, ...data };
  }

  static async delete(id: string | number, connection?: any): Promise<boolean> {
    const conn = this.getConnection(connection);
    await conn.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return true;
  }

  static async paginate(options: any = {}, connection?: any): Promise<any> {
    const conn = this.getConnection(connection);
    const {
      search = null,
      perPage: rawPerPage = 10,
      page: rawPage = 1,
      filters = [],
      orderBy = "id",
      sortMethod = "DESC",
      searchable = [],
      searchableRaw = [],
      with: withRelations = [],
    } = options;

    const perPage = parseInt(String(rawPerPage), 10) || 10;
    const page    = parseInt(String(rawPage), 10) || 1;
    const offset  = (page - 1) * perPage;
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Validar orderBy e sortMethod para prevenir SQL injection
    const safeOrderBy = (SAFE_COL_RE.test(orderBy) && (this as any).allowedColumns.includes(orderBy))
      ? orderBy
      : "id";
    const safeSortMethod = sortMethod === "ASC" ? "ASC" : "DESC";

    // Remove filtros RAW vindos do cliente (só podem ser criados internamente pelos models)
    const safeFilters = Array.isArray(filters)
      ? filters.filter((f: any) => f.operator !== 'RAW' || f._internal === true)
      : [];

    if (safeFilters.length) {
      for (const f of safeFilters) {
        // RAW: usado apenas internamente pelos models — injeta SQL literal
        if (f.operator === "RAW") {
          whereClauses.push(f.field);
          params.push(f.value);
          continue;
        }
        if (!f.value && f.operator !== "IS NULL" && f.operator !== "IS NOT NULL") continue;
        // Validar nome do campo
        if (!SAFE_COL_RE.test(f.field) || !(this as any).allowedColumns.includes(f.field)) continue;
        switch (f.operator) {
          case "LIKE":
            whereClauses.push(`${f.field} LIKE ?`);
            params.push(`%${f.value}%`);
            break;
          case "IN":
          case "NOT IN":
            if (Array.isArray(f.value) && f.value.length) {
              const placeholders = f.value.map(() => "?").join(", ");
              whereClauses.push(`${f.field} ${f.operator} (${placeholders})`);
              params.push(...f.value);
            }
            break;
          default:
            whereClauses.push(`${f.field} ${f.operator} ?`);
            params.push(f.value);
        }
      }
    }

    if (search && (searchable.length > 0 || searchableRaw.length > 0)) {
      const safeSearchable = searchable.filter((col: string) =>
        SAFE_COL_RE.test(col) && (this as any).allowedColumns.includes(col)
      );
      const allParts = [
        ...safeSearchable.map((col: string) => `${col} LIKE ?`),
        ...searchableRaw.map((r: any) => r.sql),
      ];
      if (allParts.length > 0) {
        whereClauses.push(`(${allParts.join(" OR ")})`);
        safeSearchable.forEach(() => params.push(`%${search}%`));
        searchableRaw.forEach(() => params.push(`%${search}%`));
      }
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const [[{ total }]] = await conn.query(
        `SELECT COUNT(*) as total FROM ${this.tableName} ${whereSQL}`,
        params
    );

    const [rows] = await conn.query(
        `SELECT * FROM ${this.tableName} ${whereSQL} ORDER BY ${safeOrderBy} ${safeSortMethod} LIMIT ? OFFSET ?`,
        [...params, perPage, offset]
    );
    if (Array.isArray(withRelations) && withRelations.length && rows.length) {
      for (const relation of withRelations) {
        if ((this as any).allowedRelations.includes(relation) && typeof (this as any)[relation] === "function") {
          for (const row of rows) {
            row[relation] = await (this as any)[relation](row, conn);
          }
        }
      }
    }
    return {
      success: true,
      data: rows,
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.ceil(total / perPage),
      from: offset + 1,
      to: offset + (rows as any[]).length,
    };
  }
}
