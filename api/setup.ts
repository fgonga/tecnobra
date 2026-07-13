/*
 *  Tecnobra — Setup idempotente: utilizador admin, perfis default,
 *  parametrização base e templates de notificação.
 */

import { UserModel } from "./src/models/user.model"
import { BaseModel } from "./src/models/base.model"
import { ConfigModel } from "./src/models/config.model";
import { ProfileModel } from "./src/models/profile.model";
import { seedNotificationTemplates } from "./src/db/seedNotificationTemplates";

const DEFAULT_PROFILES: { name: string; description: string; rules: string[] }[] = [
    {
        name: "Administrador",
        description: "Acesso total ao sistema",
        rules: ["*"],
    },
    {
        name: "Encarregado",
        description: "Gestão da obra: pessoal, equipamentos, materiais e relatórios",
        rules: [
            "dashboard", "obras", "empresas", "trabalhadores", "equipamentos",
            "materiais", "visitantes", "veiculos", "desempenho", "alertas", "reports",
        ],
    },
    {
        name: "Portaria",
        description: "Registo de entradas e saídas na portaria",
        rules: ["portaria"],
    },
];

async function runSetup() {
    try {
        const connection = await BaseModel.getConnection()

        // ─── Perfis default + regras (antes do admin, para o auto-assign) ───
        for (const p of DEFAULT_PROFILES) {
            let profile = await ProfileModel.findOneBy("name", p.name, connection)
            if (!profile) {
                profile = await ProfileModel.create({ name: p.name, description: p.description }, connection)
                console.log(`Perfil "${p.name}" criado.`)
            }
            for (const rule of p.rules) {
                await ProfileModel.addRule(profile.id, rule)
            }
        }

        // ─── Utilizador admin ───
        const adminData = {
            username: "admin",
            password: "admin",
            phone: "900000000",
            name: "Tecnobra",
            role: "superadmin",
        }
        const existing = await UserModel.findOneBy("username", adminData.username, connection)
        if (!existing) {
            await UserModel.create(adminData, connection)
            console.log("Utilizador administrador criado.")
        } else {
            console.log("Utilizador administrador já existe.")
        }

        // ─── Parametrização (linha única id=1) ───
        const cfg = await ConfigModel.findOneBy("id", 1, connection)
        if (!cfg) {
            await ConfigModel.genericCreate({
                nome_organizacao: "Tecnobra",
                events_dispatch_interval: 60,
                alertas_ativos: 1,
                alerta_ferramentas_hora: "18:30",
                stock_alerta_ativo: 1,
            })
            console.log("Parametrização base criada.")
        }

        // ─── Templates de notificação ───
        const seeded = await seedNotificationTemplates(connection)
        console.log(`${seeded} template(s) de notificação inserido(s).`)
    } catch (err) {
        console.error("Erro no setup:", err)
        process.exitCode = 1
    } finally {
        process.exit()
    }
}
runSetup()
