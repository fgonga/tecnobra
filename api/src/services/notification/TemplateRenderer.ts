/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Renderer de templates — sandbox seguro, NÃO usa eval (evita RCE).
 *  Port do TemplateRenderer.php (projeto 2025).
 *
 *  Sintaxe suportada:
 *      {{ variable.path }}              — substitui pelo valor
 *      {{ variable | filter }}          — aplica filtro sem argumento
 *      {{ variable | filter:arg }}      — com argumento
 *      {{ variable | f1 | f2:x }}       — pipeline
 *
 *  Filtros whitelisted (qualquer outro nome devolve original):
 *      upper / lower / date:format / currency[:symbol] / number:decimals
 *      default:value / truncate:n
 *
 *  Variáveis ausentes → '' (string vazia) — nunca lança.
 */

type Vars = Record<string, any>;

export class TemplateRenderer {
  static render(template: string, vars: Vars): string {
    return template.replace(/\{\{\s*(.+?)\s*\}\}/g, (_m, expr: string) =>
      this.evaluate(expr.trim(), vars)
    );
  }

  /**
   * Variáveis usadas no template que não constam do conjunto permitido.
   * Usado na validação ao guardar.
   */
  static unknownVariables(template: string, allowedKeys: string[]): string[] {
    const unknown: Record<string, true> = {};
    const re = /\{\{\s*(.+?)\s*\}\}/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(template)) !== null) {
      const name = (match[1].split("|")[0] ?? "").trim();
      if (name === "" || allowedKeys.includes(name)) continue;
      unknown[name] = true;
    }
    return Object.keys(unknown);
  }

  private static evaluate(expression: string, vars: Vars): string {
    const parts = expression.split("|").map((p) => p.trim());
    const varPath = parts.shift() ?? "";
    let value: any = this.resolve(varPath, vars);
    for (const filter of parts) {
      value = this.applyFilter(filter, value);
    }
    if (value === null || value === undefined || value === false) return "";
    if (typeof value === "object") return "";
    return String(value);
  }

  private static resolve(path: string, vars: Vars): any {
    if (path === "") return null;
    let ref: any = vars;
    for (const segment of path.split(".")) {
      if (ref != null && typeof ref === "object" && segment in ref) {
        ref = ref[segment];
        continue;
      }
      return null;
    }
    return ref;
  }

  private static applyFilter(filter: string, value: any): any {
    const idx = filter.indexOf(":");
    const name = (idx === -1 ? filter : filter.slice(0, idx)).trim();
    const arg = idx === -1 ? null : filter.slice(idx + 1).trim();

    switch (name) {
      case "upper":
        return this.isScalar(value) ? String(value).toUpperCase() : value;
      case "lower":
        return this.isScalar(value) ? String(value).toLowerCase() : value;
      case "date":
        return this.filterDate(value, arg ?? "d/m/Y");
      case "currency":
        return this.filterCurrency(value, arg ?? "Kz");
      case "number":
        return this.filterNumber(value, parseInt(arg ?? "0", 10) || 0);
      case "default":
        return this.isEmpty(value) ? arg ?? "" : value;
      case "truncate":
        return this.filterTruncate(value, parseInt(arg ?? "80", 10) || 80);
      default:
        return value;
    }
  }

  private static filterDate(value: any, format: string): string {
    if (this.isEmpty(value)) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    const map: Record<string, string> = {
      d: pad(d.getDate()),
      m: pad(d.getMonth() + 1),
      Y: String(d.getFullYear()),
      H: pad(d.getHours()),
      i: pad(d.getMinutes()),
      s: pad(d.getSeconds()),
    };
    return format.replace(/[dmYHis]/g, (c) => map[c] ?? c);
  }

  private static filterCurrency(value: any, symbol: string): string {
    if (this.isEmpty(value)) return "";
    const n = this.isNumeric(value) ? Number(value) : 0;
    return `${this.numberFormat(n, 2)} ${symbol}`;
  }

  private static filterNumber(value: any, decimals: number): string {
    if (this.isEmpty(value)) return "";
    const n = this.isNumeric(value) ? Number(value) : 0;
    return this.numberFormat(n, decimals);
  }

  private static filterTruncate(value: any, limit: number): string {
    if (this.isEmpty(value)) return "";
    const s = String(value);
    return s.length <= limit ? s : s.slice(0, limit) + "…";
  }

  /** number_format($n, $decimals, ',', ' ') — estilo pt-AO. */
  private static numberFormat(n: number, decimals: number): string {
    const fixed = n.toFixed(decimals);
    const [intPart, decPart] = fixed.split(".");
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return decPart ? `${grouped},${decPart}` : grouped;
  }

  private static isEmpty(value: any): boolean {
    return value === null || value === undefined || value === "" || value === false;
  }

  private static isScalar(value: any): boolean {
    const t = typeof value;
    return t === "string" || t === "number" || t === "boolean";
  }

  private static isNumeric(value: any): boolean {
    return value !== "" && value !== null && !isNaN(Number(value));
  }
}
