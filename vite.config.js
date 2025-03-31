import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    server: {
        port: 5173,
        strictPort: false,
        host: true,
        open: false,
        hmr: {
            overlay: true,
        },
        watch: {
            usePolling: true,
        },
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                },
            },
        },
    },
    define: {
        'process.env.IS_ELECTRON': JSON.stringify(!!process.env.ELECTRON),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
})