# 1.1 Проект

Статус: выполнено.

## Что сделано

- Инициализирован проект на React + Vite (JavaScript, без TypeScript).
- Зависимости ограничены необходимым минимумом:
  - `react`, `react-dom` — рантайм;
  - `vite`, `@vitejs/plugin-react` — сборка и dev-сервер.
- Добавлены корневые файлы: `index.html`, `vite.config.js`, `.gitignore`.
- Создана точка входа `src/main.jsx` с `StrictMode` и корневой компонент `src/App.jsx`.
- Заведена структура папок под последующие задачи:
  ```
  public/
  src/
    assets/
    components/
    data/
    features/
      coworkings/
      demo/
      presentation/
    lib/
    state/
    styles/
  ```
- `src/styles/index.css` подключён в точке входа; токены и глобальные стили добавляются в задаче 1.2.

## Проверка

- `npm run build` проходит без ошибок.
