import * as fs from "fs";
import * as path from "path";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type HttpMethod = (typeof METHODS)[number];

interface EndpointDefinition {
  folder: string;
  name: string;
  method: HttpMethod;
  url: string;
  expectedStatus: number;
  headers?: Record<string, string>;
  body?: unknown;
}

const COLLECTION_DIR = path.join(__dirname, "../collections/restful-booker");
const ENDPOINTS_DIR = path.join(__dirname, "../data/endpoints");
const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};
const force = process.argv.includes("--force");

const indent = (text: string, spaces: number): string =>
  text
    .split("\n")
    .map((line) => " ".repeat(spaces) + line)
    .join("\n");

const isRequestFile = (file: string): boolean =>
  file.endsWith(".yml") && file !== "folder.yml";

function validate(def: EndpointDefinition, file: string): void {
  const required = [
    "folder",
    "name",
    "method",
    "url",
    "expectedStatus",
  ] as const;
  const missing = required.filter((key) => def[key] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `${file}: faltan campos obligatorios: ${missing.join(", ")}`,
    );
  }
  if (!METHODS.includes(def.method)) {
    throw new Error(`${file}: método inválido '${def.method}'`);
  }
}

function resolveSeq(dir: string, target: string): number {
  if (fs.existsSync(target)) {
    const match = fs.readFileSync(target, "utf8").match(/^\s*seq:\s*(\d+)/m);
    if (match) return Number(match[1]);
  }
  return fs.readdirSync(dir).filter(isRequestFile).length + 1;
}

function buildYaml(def: EndpointDefinition, seq: number): string {
  const headers = { ...DEFAULT_HEADERS, ...def.headers };

  const headersSection = `  headers:
${Object.entries(headers)
  .map(
    ([name, value]) =>
      `    - name: ${JSON.stringify(name)}\n      value: ${JSON.stringify(value)}`,
  )
  .join("\n")}
`;

  const bodySection =
    def.body !== undefined
      ? `  body:
    type: json
    data: |-
${indent(JSON.stringify(def.body, null, 2), 6)}
`
      : "";

  return `info:
  name: ${def.name}
  type: http
  seq: ${seq}
  tags:
    - ${def.folder}

http:
  method: ${def.method}
  url: ${JSON.stringify(def.url)}
${headersSection}${bodySection}  auth: inherit

runtime:
  assertions:
    - expression: res.status
      operator: eq
      value: ${def.expectedStatus}

settings:
  encodeUrl: true
`;
}

function generate(file: string): void {
  const def = JSON.parse(fs.readFileSync(file, "utf8")) as EndpointDefinition;
  validate(def, file);

  const dir = path.join(COLLECTION_DIR, def.folder);
  fs.mkdirSync(dir, { recursive: true });

  const folderFile = path.join(dir, "folder.yml");
  if (!fs.existsSync(folderFile)) {
    fs.writeFileSync(
      folderFile,
      `info:\n  name: ${def.folder}\n  type: folder\n  seq: 1\n`,
    );
  }

  const target = path.join(dir, `${def.name}.yml`);
  if (fs.existsSync(target) && !force) {
    console.log(
      `- Omitido (ya existe, usa --force para sobrescribir): ${target}`,
    );
    return;
  }

  fs.writeFileSync(target, buildYaml(def, resolveSeq(dir, target)));
  console.log(`- Generado: ${target}`);
}

if (!fs.existsSync(ENDPOINTS_DIR)) {
  throw new Error(`No existe la carpeta de definiciones: ${ENDPOINTS_DIR}`);
}

const files = fs
  .readdirSync(ENDPOINTS_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => path.join(ENDPOINTS_DIR, file));

if (files.length === 0) {
  throw new Error(`No hay archivos .json en ${ENDPOINTS_DIR}`);
}

files.forEach(generate);
