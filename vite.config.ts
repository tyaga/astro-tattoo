import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        // Lightning CSS по умолчанию переписывает медиазапросы в новый
        // синтаксис (width<=820px), которого не знают Safari до 16.4 —
        // а на телефоне у нас на медиазапросе держится вся раскладка
        cssTarget: ['chrome100', 'safari15', 'firefox100', 'edge100'],
    },
});
