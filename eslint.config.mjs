import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Python backend — venv içindeki üçüncü taraf JS (Cloudinary'nin paketlediği
    // jQuery eklentileri) aksi hâlde lint'e girip onlarca sahte hata üretiyor.
    "backend/**",
  ]),
]);

export default eslintConfig;
