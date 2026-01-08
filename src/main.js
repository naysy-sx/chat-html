// src/main.js

import './styles/theme.css';
import { bootstrap } from './runtime/bootstrap.js';

// UI компоненты загружаются динамически через features
// Но auth.ui.js нужен сразу для shell
import './features/auth/auth.ui.js';

document.documentElement.lang = 'ru';

bootstrap().catch((err) => {
	console.error('Bootstrap failed:', err);

	document.getElementById('app').innerHTML = `
        <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: #f5f5f5;
        ">
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 16px;
                max-width: 500px;
                text-align: center;
                box-shadow: 0 4px 24px rgba(0,0,0,0.1);
            ">
                <h2 style="color: #dc3545; margin: 0 0 1rem 0;">
                    ❌ Ошибка запуска
                </h2>
                <pre style="
                    text-align: left;
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    overflow: auto;
                    font-size: 0.85rem;
                ">${err.message}\n\n${err.stack}</pre>
                <button 
                    onclick="location.reload()" 
                    style="
                        margin-top: 1rem;
                        padding: 0.75rem 1.5rem;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                    "
                >
                    🔄 Перезагрузить
                </button>
            </div>
        </div>
    `;
});
