import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@/assets/styles/typography.css'
import '@/assets/styles/vuetify-overrides.css'

import App from './App.vue'
import { buildVuetifyOptions } from './ui/theme'

const app = createApp(App)

// Setup Pinia
app.use(createPinia())

// Setup Vuetify with Atlas3-inspired theme tokens
const vuetify = createVuetify({
  components,
  directives,
  ...buildVuetifyOptions(),
})

app.use(vuetify)

app.mount('#app')
