import { db } from "./src/db/db"
import { UserModel } from "./src/models/user.model"

const [,, identifier, newPassword] = process.argv

if (!identifier || !newPassword) {
  console.error("Uso: bun run api/scripts/reset-password.ts <username|email|phone> <nova_senha>")
  process.exit(1)
}

const user =
  await UserModel.findOneByWithPassword("username", identifier) ??
  await UserModel.findOneByWithPassword("phone", identifier)

if (!user) {
  console.error(`❌ Usuário não encontrado: ${identifier}`)
  await db.end()
  process.exit(1)
}

await UserModel.update(user.id, { password: newPassword })

console.log(`✅ Senha redefinida para o usuário "${user.name}" (id=${user.id})`)

await db.end()
