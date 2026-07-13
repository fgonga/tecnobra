<template>
  <div>
    <Bheader />
    <div class="page-wrapper">
      <div class="container-xl relative mt-5">
        <div class="mb-3">
          <input
            type="text"
            v-model="paymentCode"
            class="form-control"
            placeholder="Payment Code"
          />
        </div>

        <div class="d-flex gap-2">
          <b-button variant="primary" @click="joinRoom">Entrar na sala</b-button>
          <b-button variant="secondary" @click="leaveRoom">Sair da sala</b-button>
          <b-button variant="success" @click="simulateEmit">Simular pagamento</b-button>
          <b-button variant="secondary" @click="clearlogs"> Limpar</b-button>
        </div>

        <div class="mt-4 p-3 bg-light rounded border">
          <h6 class="fw-semibold">Logs:</h6>
          <pre style="max-height: 300px; overflow-y: auto">{{ logs.join('\n') }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue"
import Bheader from "@/modules/checkout/common/presentation/components/Bheader.vue"
import { io, Socket } from "socket.io-client"

const paymentCode = ref("")
const logs = ref<string[]>([])

let socket: Socket

onMounted(() => {
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    transports: ["websocket"],
  })

  socket.on("connect", () => log(`✅ Conectado: ${socket.id}`))
  socket.on("disconnect", () => log("❌ Desconectado do servidor"))
  socket.on("connect_error", err => log(`⚠️ Erro de conexão: ${err.message}`))

  socket.on("payment-update", data => {
    log(`💬 Atualização recebida: ${JSON.stringify(data, null, 2)}`)
  })
})

onBeforeUnmount(() => {
  socket.disconnect()
})

function log(message: string) {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${message}`)
}

function joinRoom() {
  if (!paymentCode.value) return log("⚠️ Informe o código do pagamento")
  socket.emit("join-payment", paymentCode.value)
  log(`➡️ Entrou na sala ${paymentCode.value}`)
}

function leaveRoom() {
  if (!paymentCode.value) return log("⚠️ Informe o código do pagamento")
  socket.emit("leave-payment", paymentCode.value)
  log(`⬅️ Saiu da sala ${paymentCode.value}`)
}
function clearlogs() {
  logs.value = []
}

async function simulateEmit(status = false) {
  if (!paymentCode.value) return log("⚠️ Informe o código do pagamento")
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/snotify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentId: paymentCode.value,
        message: "Pagamento atualizado com sucesso",
        success: status
      }),
    })
    const data = await res.json()
    log(`📡 Emit simulado: ${JSON.stringify(data)}`)
  } catch (err) {
    log(`❌ Erro ao simular emit: ${err}`)
  }
}
</script>
