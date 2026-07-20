const fs = require("node:fs");
const path = require("node:path");

const source = path.resolve(__dirname, "../generated/prisma");
const destination = path.resolve(__dirname, "../dist/generated/prisma");

if (!fs.existsSync(source)) {
  throw new Error(
    "Generated Prisma runtime is missing. Run `npm run prisma:generate` first.",
  );
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, { recursive: true });
