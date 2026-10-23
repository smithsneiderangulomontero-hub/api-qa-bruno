import * as fs from "fs";
import * as path from "path";

interface BookingDates {
  checkin: string;
  checkout: string;
}

interface BookingPayload {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds: string;
}

interface EndpointDefinition {
  folder: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  expectedStatus: number;
  body?: BookingPayload;
}

const newEndpoint: EndpointDefinition = {
  folder: "booking",
  name: "create-booking",
  method: "POST",
  url: "{{baseUrl}}/booking",
  expectedStatus: 200,
  body: {
    firstname: "John",
    lastname: "Doe",
    totalprice: 111,
    depositpaid: true,
    bookingdates: {
      checkin: "2026-01-01",
      checkout: "2026-01-02",
    },
    additionalneeds: "Breakfast",
  },
};

const indent = (text: string, spaces: number): string =>
  text
    .split("\n")
    .map((line) => " ".repeat(spaces) + line)
    .join("\n");

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const headersSection = `  headers:
${Object.entries(headers)
  .map(([name, value]) => `    - name: ${name}\n      value: ${value}`)
  .join("\n")}
`;

const targetDir = path.join(
  __dirname,
  "../collections/restful-booker",
  newEndpoint.folder,
);
fs.mkdirSync(targetDir, { recursive: true });

// Bruno necesita un folder.yml para que la carpeta aparezca con nombre
const folderFile = path.join(targetDir, "folder.yml");
if (!fs.existsSync(folderFile)) {
  fs.writeFileSync(
    folderFile,
    `info:\n  name: ${newEndpoint.folder}\n  type: folder\n  seq: 1\n`,
  );
}

const bodySection = newEndpoint.body
  ? `  body:
    type: json
    data: |-
${indent(JSON.stringify(newEndpoint.body, null, 2), 6)}
`
  : "";

const content = `info:
  name: ${newEndpoint.name}
  type: http
  seq: 1
  tags:
    - ${newEndpoint.folder}

http:
  method: ${newEndpoint.method}
  url: "${newEndpoint.url}"
${headersSection}${bodySection}  auth: inherit

runtime:
  assertions:
    - expression: res.status
      operator: eq
      value: ${newEndpoint.expectedStatus}

settings:
  encodeUrl: true
`;

const filePath = path.join(targetDir, `${newEndpoint.name}.yml`);
fs.writeFileSync(filePath, content);

console.log(`Endpoint '${newEndpoint.name}' generado en ${filePath}`);
