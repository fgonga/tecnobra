import { createRequire } from 'module'
import { config } from './src/config/env.js'

// socket.io 4.8.x expõe um wrapper.mjs que o Bun não resolve (falta 'default' export).
// Forçamos o caminho CommonJS via require para obter a classe Server real.
const { Server } = createRequire(import.meta.url)('socket.io')

const io = new Server(config.socket.port as any, {
  cors: { origin: '*' },
})
// 3. quando um cliente se conecta
io.on('connection', socket => {
  console.log('Cliente conectado:', socket.id)

  // 4. cliente entra em uma “sala” específica do pagamento
  socket.on('join-payment', (paymentId: string) => {
    socket.join(paymentId)
    console.log(`Socket ${socket.id} entrou na sala ${paymentId}`)
  })

  // 5. cliente pode sair manualmente da sala
  socket.on('leave-payment', (paymentId: string) => {
    socket.leave(paymentId)
    console.log(`Socket ${socket.id} saiu da sala ${paymentId}`)
  })

  // 6. quando o cliente desconecta
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id)
  })
})
export default io;