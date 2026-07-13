import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '@common/presentation/router'
import 'notyf/notyf.min.css';
import '@tabler/core/dist/js/tabler.min.js'
import {createBootstrap} from "bootstrap-vue-next";

import './common/application/styles/index.scss'
import FormField from '@components/FormField.vue'
import TablePage from '@components/TablePage.vue'
import MessageAlert from '@components/MessageAlert.vue'
import ModalLoading from '@components/ModalLoading.vue'
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(createBootstrap())
app.mount('#app')
app.component('FormField', FormField)
app.component('MessageAlert', MessageAlert)
app.component('ModalLoading', ModalLoading)
app.component('TablePage', TablePage)
