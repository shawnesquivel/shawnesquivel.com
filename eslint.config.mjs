import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // Chrome 150+ returns a Promise from scrollTo/scrollBy/scrollIntoView. An implicit return hands it to React
          // as the effect's cleanup, which then crashes the page on unmount ("destroy is not a function").
          selector:
            "CallExpression[callee.name=/^use(Layout|Insertion)?Effect$/] > ArrowFunctionExpression.arguments[expression=true][body.type!='ArrowFunctionExpression'][body.type!='FunctionExpression']",
          message: "Effects must not implicitly return a value. Wrap the body in braces: useEffect(() => { … }, deps).",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
