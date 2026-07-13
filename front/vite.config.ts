import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers'
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 9300,
    strictPort: false,
    allowedHosts: ['localhost', '127.0.0.1','checkout.local'],
  },
  plugins: [
    vue(),
    vueDevTools(),
    Components({
      resolvers: [BootstrapVueNextResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@common/hooks': fileURLToPath(new URL('./src/common/presentation/hooks', import.meta.url)),
      '@common': fileURLToPath(new URL('./src/common', import.meta.url)),
      '@components': fileURLToPath(
        new URL('./src/common/presentation/components', import.meta.url),
      ),
      '@central': fileURLToPath(new URL('./src/modules/central', import.meta.url)),
    },
  },
})
