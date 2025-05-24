# Chess Coach Web App

This is the frontend for the Chess Coach project. It provides a user-friendly interface for uploading and analyzing chess games, powered by a backend API that uses Stockfish and AI to give move-by-move feedback and coaching.

## Environment Variables

This project uses environment variables to configure certain settings at build time. The most important one is:

### `VITE_ANALYZE_USERNAMES`
- **Purpose:**  Specifies a comma-separated list of usernames that the app will analyze by default.
- **How to set:**  Create a `.env` file in the root of your `web-app` directory (next to `package.json`).
- **Example:**
  ```
  VITE_ANALYZE_USERNAMES=gerardmccarthy,gerardmccarthy2
  ```

#### Notes
- All environment variables used in Vite **must** be prefixed with `VITE_` to be accessible in your frontend code.
- After changing environment variables, you should restart the dev server for changes to take effect.
- Do **not** commit your `.env` file to version control if it contains sensitive or personal information. Add `.env` to your `.gitignore`.

#### Accessing in Code
You can access these variables in your code using:
```js
const usernames = (import.meta.env.VITE_ANALYZE_USERNAMES || '').split(',').map(name => name.trim());
```

---

Add further setup, usage, and contribution instructions below as needed.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
