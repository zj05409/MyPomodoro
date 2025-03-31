import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        {
            name: 'copy-audio-files',
            closeBundle() {
                // 确保音频文件被正确复制
                console.log('复制音频文件到dist目录...');
                try {
                    copyFileSync(
                        path.resolve(__dirname, 'public/alarm.mp3'),
                        path.resolve(__dirname, 'dist/alarm.mp3')
                    );
                    copyFileSync(
                        path.resolve(__dirname, 'public/ticking.mp3'),
                        path.resolve(__dirname, 'dist/ticking.mp3')
                    );
                    console.log('音频文件复制成功');
                } catch (error) {
                    console.error('复制音频文件失败:', error);
                }
            }
        }
    ],
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
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                },
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]'
            }
        }
    },
    define: {
        'process.env.IS_ELECTRON': JSON.stringify(!!process.env.ELECTRON),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    optimizeDeps: {
        exclude: ['electron']
    }
})