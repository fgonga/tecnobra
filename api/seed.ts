/*
 *  Tecnobra — Seed de dados demo: obras, empresas, trabalhadores,
 *  equipamentos, materiais e métricas de desempenho.
 *
 *  Uso: bun run seed.ts   |   bun artisan.ts db:seed
 */

import { nanoid } from "nanoid";
import { db } from "./src/db/db";

const OBRAS = [
    { nome: "Edifício Atlântico", codigo: "OBR-001", endereco: "Av. Marginal, Luanda", cliente: "Imobiliária Horizonte" },
    { nome: "Condomínio Bela Vista", codigo: "OBR-002", endereco: "Talatona, Luanda", cliente: "Grupo Bela Vista" },
];

const EMPRESAS = [
    { nome: "Construtora Alfa, Lda.", nif: "5401234567", tipo: "empreiteiro", contacto_nome: "Carlos Mendes", telefone: "923111222", email: "geral@alfa.co.ao" },
    { nome: "Beta Instalações Elétricas", nif: "5407654321", tipo: "subempreiteiro", contacto_nome: "Ana Sousa", telefone: "924333444", email: "obras@beta.co.ao" },
    { nome: "Gama Canalizações", nif: "5409876543", tipo: "subempreiteiro", contacto_nome: "Pedro Neto", telefone: "925555666", email: "geral@gama.co.ao" },
    { nome: "Fornecedora Delta Materiais", nif: "5401112223", tipo: "fornecedor", contacto_nome: "Rita Campos", telefone: "926777888", email: "vendas@delta.co.ao" },
    { nome: "Fiscaliza+ Engenharia", nif: "5404445556", tipo: "fiscalizacao", contacto_nome: "Miguel Rocha", telefone: "927999000", email: "info@fiscalizamais.co.ao" },
];

const NOMES = [
    "João Manuel", "António Silva", "Carlos Domingos", "Manuel Costa", "Pedro Cassinda",
    "Francisco Kiala", "Mário Bengui", "Alberto Chipenda", "José Catumbela", "Domingos Sebastião",
    "Adão Kudibanguela", "Julião Mateus", "Ernesto Cahama", "Lourenço Bento", "Simão Kapossa",
    "Abel Muteka", "Rafael Chindele", "Moisés Calei", "Gabriel Tchizainga", "Daniel Ucuahamba",
    "Isaías Sachiteta", "Paulo Wambu", "Fernando Chilala", "Teodoro Kambinda", "Nelson Sakala",
    "Osvaldo Chissola", "Rui Catraio", "Hélder Bumba", "Estêvão Muhongo", "Baptista Calunga",
];

const FUNCOES = ["Pedreiro", "Servente", "Eletricista", "Canalizador", "Carpinteiro", "Ferrageiro", "Pintor", "Encarregado de frente", "Operador de grua", "Soldador"];

const EQUIPAMENTOS = [
    { nome: "Berbequim Bosch GSB 13", codigo: "FER-001", categoria: "ferramenta" },
    { nome: "Rebarbadora Makita GA9020", codigo: "FER-002", categoria: "ferramenta" },
    { nome: "Martelo demolidor Hilti TE 1000", codigo: "FER-003", categoria: "ferramenta" },
    { nome: "Serra circular DeWalt DWE575", codigo: "FER-004", categoria: "ferramenta" },
    { nome: "Betoneira 400L", codigo: "EQP-001", categoria: "equipamento" },
    { nome: "Vibrador de betão", codigo: "EQP-002", categoria: "equipamento" },
    { nome: "Gerador 15 kVA", codigo: "EQP-003", categoria: "equipamento" },
    { nome: "Andaime metálico (lote 10 módulos)", codigo: "EQP-004", categoria: "equipamento" },
    { nome: "Nível laser Leica Lino", codigo: "FER-005", categoria: "ferramenta" },
    { nome: "Compactador de solo (saltitão)", codigo: "EQP-005", categoria: "equipamento" },
];

const MATERIAIS = [
    { nome: "Cimento 42,5R", unidade: "saco", categoria: "aglomerantes", stock_minimo: 50 },
    { nome: "Areia lavada", unidade: "m3", categoria: "inertes", stock_minimo: 10 },
    { nome: "Brita 19mm", unidade: "m3", categoria: "inertes", stock_minimo: 10 },
    { nome: "Bloco de cimento 15cm", unidade: "un", categoria: "alvenaria", stock_minimo: 500 },
    { nome: "Varão de aço 12mm", unidade: "vara", categoria: "ferragens", stock_minimo: 100 },
    { nome: "Cabo elétrico 2,5mm²", unidade: "rolo", categoria: "eletricidade", stock_minimo: 5 },
    { nome: "Tubo PVC 110mm", unidade: "vara", categoria: "canalizacao", stock_minimo: 20 },
    { nome: "Tinta plástica branca", unidade: "balde", categoria: "pinturas", stock_minimo: 10 },
];

const METRICAS = [
    { nome: "Alvenaria", unidade: "m2", descricao: "Área de parede executada por dia" },
    { nome: "Reboco", unidade: "m2", descricao: "Área rebocada por dia" },
    { nome: "Betonagem", unidade: "m3", descricao: "Volume de betão aplicado" },
    { nome: "Pintura", unidade: "m2", descricao: "Área pintada por dia" },
];

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
    try {
        // ─── Obras ───
        const obraIds: number[] = [];
        for (const o of OBRAS) {
            const [r]: any = await db.execute(
                "INSERT IGNORE INTO obras (nome, codigo, endereco, cliente, estado, data_inicio) VALUES (?, ?, ?, ?, 'ativa', CURDATE())",
                [o.nome, o.codigo, o.endereco, o.cliente]
            );
            if (r.insertId) obraIds.push(r.insertId);
        }
        if (!obraIds.length) {
            const [rows]: any = await db.execute("SELECT id FROM obras ORDER BY id");
            rows.forEach((row: any) => obraIds.push(row.id));
        }
        console.log(`Obras: ${obraIds.length}`);

        // ─── Empresas ───
        const empresaIds: number[] = [];
        for (const e of EMPRESAS) {
            const [r]: any = await db.execute(
                "INSERT INTO empresas (nome, nif, tipo, contacto_nome, telefone, email) VALUES (?, ?, ?, ?, ?, ?)",
                [e.nome, e.nif, e.tipo, e.contacto_nome, e.telefone, e.email]
            );
            empresaIds.push(r.insertId);
        }
        console.log(`Empresas: ${empresaIds.length}`);

        // Só empreiteiro/subempreiteiros têm trabalhadores no seed
        const empregadoras = empresaIds.slice(0, 3);

        // ─── Trabalhadores ───
        let trabalhadores = 0;
        for (const nome of NOMES) {
            const obraId = pick(obraIds);
            await db.execute(
                `INSERT INTO trabalhadores (obra_id, empresa_id, nome, funcao, telefone, email, documento, qr_token, cartao_estado, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativo', 'ativo')`,
                [
                    obraId,
                    pick(empregadoras),
                    nome,
                    pick(FUNCOES),
                    `9${Math.floor(20000000 + Math.random() * 9999999)}`,
                    `${nome.toLowerCase().replace(/\s+/g, ".")}@exemplo.co.ao`,
                    `00${Math.floor(1000000 + Math.random() * 8999999)}LA0${Math.floor(10 + Math.random() * 89)}`,
                    nanoid(21),
                ]
            );
            trabalhadores++;
        }
        console.log(`Trabalhadores: ${trabalhadores}`);

        // ─── Equipamentos ───
        let equipamentos = 0;
        for (const eq of EQUIPAMENTOS) {
            await db.execute(
                "INSERT INTO equipamentos (obra_id, nome, codigo, categoria, qr_token) VALUES (?, ?, ?, ?, ?)",
                [pick(obraIds), eq.nome, eq.codigo, eq.categoria, nanoid(21)]
            );
            equipamentos++;
        }
        console.log(`Equipamentos: ${equipamentos}`);

        // ─── Materiais + orçamento ───
        let materiais = 0;
        for (const obraId of obraIds) {
            for (const m of MATERIAIS) {
                const [r]: any = await db.execute(
                    "INSERT INTO materiais (obra_id, nome, unidade, categoria, stock_atual, stock_minimo, qr_token) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [obraId, m.nome, m.unidade, m.categoria, m.stock_minimo * 3, m.stock_minimo, nanoid(21)]
                );
                await db.execute(
                    "INSERT INTO orcamentos_materiais (obra_id, material_id, quantidade_orcada) VALUES (?, ?, ?)",
                    [obraId, r.insertId, m.stock_minimo * 20]
                );
                materiais++;
            }
        }
        console.log(`Materiais: ${materiais}`);

        // ─── Métricas de desempenho ───
        for (const m of METRICAS) {
            await db.execute(
                "INSERT INTO metricas_desempenho (nome, unidade, descricao) VALUES (?, ?, ?)",
                [m.nome, m.unidade, m.descricao]
            );
        }
        console.log(`Métricas: ${METRICAS.length}`);

        console.log("✓ seed concluído");
    } catch (err) {
        console.error("Erro no seed:", err);
        process.exitCode = 1;
    } finally {
        process.exit();
    }
}

seed();
