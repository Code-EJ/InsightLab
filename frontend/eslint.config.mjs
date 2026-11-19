import next from "@next/eslint-plugin-next"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores([".next/**", "next-env.d.ts"]),
  next.configs["core-web-vitals"],
  reactHooks.configs.flat.recommended,
  tseslint.configs.recommended,
])
