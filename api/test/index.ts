import axios from "axios";
import fs from "fs/promises";

// Função para gerar números aleatórios
function randomPhone() {
  return `912${Math.floor(100000 + Math.random() * 900000)}`;
}

// Criar checkouts e guardar UUIDs
async function createCheckouts(batchSize: number) {
  const uuids: string[] = [];

  for (let i = 0; i < batchSize; i++) {
    const response = await axios.post("http://localhost:3000/checkout", {
      email: `user${i}@example.com`,
      name: `User${i}`,
      phone: randomPhone(),
    });

    // Supondo que a resposta retorna { uuid: "..." }
    const uuid = response.data.paymentId;
    uuids.push(uuid);
  }

  // Salvar UUIDs em JSON
  await fs.writeFile("uuids.json", JSON.stringify(uuids, null, 2));
  console.log(`Criados ${batchSize} checkouts, UUIDs salvos em uuids.json`);

  return uuids;
}

// Enviar webhooks para cada UUID
async function sendWebhooks(uuids: string[]) {
  for (const uuid of uuids) {
    await axios.post("http://localhost:3000/central/webhook", {
      id: uuid,
      merchantTransactionId: uuid,
      amount: 1000,
      options: {
        customerId: "",
        name: "",
        email: "",
        phone: "",
      },
      responseStatus: {
        successful: true,
        status: "Success",
        code: 100,
        message: "Pagamento registado",
      },
    });
  }

  console.log(`Webhooks enviados para ${uuids.length} pagamentos`);
}

// Função principal
async function main() {
  const total = 4000; // total de checkouts que queremos criar
  const batchSize = 50; // quantidade por batch
  const allUUIDs: string[] = [];

  for (let i = 0; i < total / batchSize; i++) {
    console.log(`🚀 Criando batch ${i + 1}`);
    const batchUUIDs = await createCheckouts(batchSize);
    allUUIDs.push(...batchUUIDs);

    // Envia webhooks em background sem bloquear criação do próximo batch
    sendWebhooks(batchUUIDs).catch(console.error);
  }

  console.log(
    "Todos os checkouts criados e webhooks disparados em background"
  );
}

main().catch(console.error);
