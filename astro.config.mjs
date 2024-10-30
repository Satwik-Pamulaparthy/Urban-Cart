import { defineConfig } from 'astro/config'
import netlify from '@astrojs/netlify/functions'
import react from '@astrojs/react'

// https://vitejs.dev/config/dep-optimization-options.html#optimizedeps-exclude
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
    output: 'hybrid',
    server: {
        port: 3000,
    },
    integrations: [react()],
    vite: {
        optimizeDeps: {
            exclude: ['crypto'],
        },
        publicDir: 'public',
    },
    adapter: node({
        mode: 'standalone',
    }),
    devToolbar: {
        enabled: false,
    },
})
