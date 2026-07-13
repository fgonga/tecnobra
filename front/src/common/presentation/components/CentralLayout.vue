<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
  -->

<script setup lang="ts">
import BitHeader from "@components/BitHeader.vue"
</script>

<template>
  <div>
    <BitHeader />
    <div>
      <div class="page-wrapper">
        <router-view />
        <footer class="footer footer-transparent d-print-none">
          <div class="container-xl">
            <div class="row text-center align-items-center flex-row-reverse">
              <div class="col-lg-auto ms-lg-auto">
                <ul class="list-inline list-inline-dots mb-0">
                  <li class="list-inline-item"><a class="btn-link" target="_blank" href="mailto:support@bit.ao">support@bit.ao</a> </li>
                  <li class="list-inline-item"><a class="btn-link" target="_blank" href="tel:+244926643053">+244 926 643 053</a></li>
                  <li class="list-inline-item"><a class="btn-link" href="https://docs.tabler.io" target="_blank"  rel="noopener">Documentação</a></li>
                </ul>
              </div>
              <div class="col-12 col-lg-auto mt-3 mt-lg-0">
                <ul class="list-inline list-inline-dots mb-0">
                  <li class="list-inline-item">
                    Copyright <a href="https://www.academiatreesix.com/">Academia Treesix</a> © 2025 - 2050 -  Todos direitos reservados
                  </li>
                  <li class="list-inline-item">
                    <a  class="link-secondary" rel="noopener"> v1.0.0 </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
        <!--  END FOOTER  -->
      </div>
    </div>
  </div>
</template>
