/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx}',
        './index.html',
    ],
    theme: {
        extend: {
            colors: {
                'tomato': '#ff6347',
                'tomato-dark': '#e54a2a',
                'rest': '#4ade80',
                'rest-dark': '#2ece65',
                'long-rest': '#60a5fa',
                'long-rest-dark': '#3b8df6',
            },
        },
    },
    plugins: [],
} 