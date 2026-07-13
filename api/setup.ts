import argon2 from "argon2"
import { UserModel } from "./src/models/user.model"
import { BaseModel } from "./src/models/base.model"
import {ConfigModel} from "./src/models/config.model";
import { seedNotificationTemplates } from "./src/db/seedNotificationTemplates";
async function runSetup() {
    try {
        const connection = await BaseModel.getConnection()
        const adminData = {
            username: "admin",
            password: "admin",
            phone: "925924797",
            name: "Bantu Internet Technologies",
            role: "superadmin",
        }
        const existing = await UserModel.findOneBy("username", adminData.username, connection)
        if (!existing) {
            await UserModel.create(
                {
                    name: adminData.name,
                    username: adminData.username,
                    phone: adminData.phone,
                    password: adminData.password,
                    role: adminData.role,
                },
                connection
            )
            console.log("Usuário administrador criado.")
            await ConfigModel.genericCreate({
                promotion_active:1,
                promotion_quantity:0,
                promotion_quantity_max:0
            })
        } else {
            console.log("Usuário administrador já existe.")
        }
        const seeded = await seedNotificationTemplates(connection)
        console.log(`${seeded} template(s) de notificação inserido(s).`)
    } catch (err) {
        console.error("Erro no setup:", err)
    } finally {
        process.exit(0)
    }
}
runSetup()
