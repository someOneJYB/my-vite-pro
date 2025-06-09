// eslint.config.js
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nodePlugin from "eslint-plugin-node";
import securityPlugin from "eslint-plugin-security";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

// 专门处理 src 目录下的 TypeScript 文件
export default [
  {
    files: ["src/node/**/*.{js,ts}"],
    ignores: [
      ".history",
      "**/.history",
      "**/.history/**",
      "src/**/*.d.ts",
      "**/*.d.ts",
      "src/client/src/**/*.{js,ts}",
      "playground/src/**/*.{js,ts,d.ts}",
      "dist/**",
      ".vscode/",
    ],

    plugins: {
      "@typescript-eslint": tsPlugin,
      node: nodePlugin,
      security: securityPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },

    rules: {
      "prettier/prettier": [
        "error",
        {
          // Prettier 配置直接写在这里
          semi: false,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: "es5",
          printWidth: 80,
        },
      ],
      // ========================
      // 核心规则配置
      // ========================
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "warn", // 确保 promises 被正确处理

      // ========================
      // async/await 支持
      // ========================
      "require-await": "warn", // 确保 async 函数中有 await
      "no-await-in-loop": "warn", // 对循环内的 await 发出警告

      // ========================
      // Node.js 特定规则
      // ========================
      "node/no-sync": ["warn", { allowAtRootLevel: true }],

      // ========================
      // TypeScript 高级规则
      // ========================
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // ========================
      // 安全与最佳实践
      // ========================
      "security/detect-possible-timing-attacks": "error",
      "security/detect-child-process": "warn",

      // ========================
      // 导入/导出优化
      // ========================
      "import/no-commonjs": "error",
      "import/no-cycle": "warn",
      "prettier/prettier": [
        "error",
        {
          semi: false, // 不使用分号
          singleQuote: true, // 使用单引号
          tabWidth: 2, // 缩进 2 空格
          trailingComma: "es5", // 在 ES5 兼容环境下加尾逗号
        },
      ],
    },
  },
  // =================================
  // 添加特定环境的规则覆盖
  // =================================
];
