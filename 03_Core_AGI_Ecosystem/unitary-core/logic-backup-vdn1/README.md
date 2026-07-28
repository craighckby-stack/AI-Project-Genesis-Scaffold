markdown

---
## ⚠️ Build Analysis: FAILED
> **Architect Note:** The build will fail due to a critical path mapping mismatch: tsconfig.json and components.json reference a 'src' directory ('@/*': ['./src/*']), but the project structure and README indicate that the 'app', 'components', and 'lib' directories are located at the project root. Additionally, the build script requires 'npx prisma generate' to be executed before 'next build' to avoid missing client library errors.
*Detected issues in project structure or dependency logic during heuristic scan.*