<template>
  <div class="container py-4">
    <button class="btn btn-primary mb-3" @click="print">
      Imprimir Comprovativo
    </button>

    <div id="comprovativo" class="bg-white p-4 border rounded">
      <h2>Comprovativo de Compra</h2>
      <p><b>Compra:</b> ORD757590673</p>
      <p><b>Pagamento:</b> PAY243547995</p>
      <p><b>Data:</b> 16/10/2025 16:51</p>

      <h3>Curso</h3>
      <p>Inglês para Professores e Profissionais Académicos</p>
      <p><b>Valor:</b> 500.000,00 Kz</p>
      <p><b>Método:</b> AppyPay Express</p>

      <h3>Alunos</h3>
      <ul>
        <li>Fabrício Gonga — fgonga16@gmail.com — +244 925 924 797</li>
        <li>Fabrício Gonga 2 — devgonga@gmail.com — +244 925 924 797</li>
      </ul>

      <p class="small mt-4">
        © 2021–2050 Bantu Internet Technologies, Lda. — www.bit.ao
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
const print = () => {
  const conteudo = document.getElementById("comprovativo")?.innerHTML
  if (!conteudo) return
  const janela = window.open("", "", "width=800,height=900")
  janela.document.write(`
    <html>
      <head>
        <title>Comprovativo</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h2, h3 { margin-bottom: 4px; }
        </style>
      </head>
      <body>${conteudo}</body>
    </html>
  `)
  janela.document.close()
  janela.focus()
  janela.print()
  janela.close()
}
</script>
