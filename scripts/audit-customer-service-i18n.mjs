import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";

import translations from "../src/Rools/customerService/constants/customerServiceTranslations.js";

const roots = [
  "src/Rools/customerService/pages",
  "src/Rools/customerService/features/faqs/components",
];
const attributeNames = new Set(["placeholder", "title", "aria-label", "label", "note", "description"]);
const ignored = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "API", "ID", "VIP"]);
const found = new Map();

const filesUnder = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? filesUnder(target) : target.endsWith(".jsx") ? [target] : [];
});

const add = (value, file) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!/^[A-Z]/.test(text) || !/[a-z]{2}/.test(text) || ignored.has(text) || translations[text]) return;
  if (!found.has(text)) found.set(text, new Set());
  found.get(text).add(file);
};

const walk = (node, file, inJsxExpression = false) => {
  if (!node || typeof node !== "object") return;
  if (node.type === "JSXText") add(node.value, file);
  if (node.type === "JSXAttribute" && attributeNames.has(node.name?.name)) {
    if (node.value?.type === "StringLiteral") add(node.value.value, file);
    if (node.value?.type === "JSXExpressionContainer" && node.value.expression?.type === "StringLiteral") add(node.value.expression.value, file);
  }
  if (inJsxExpression && node.type === "StringLiteral") add(node.value, file);
  if (inJsxExpression && node.type === "TemplateLiteral") node.quasis.forEach((part) => add(part.value.cooked, file));

  Object.entries(node).forEach(([key, child]) => {
    if (["loc", "start", "end", "extra"].includes(key)) return;
    const nextInJsx = inJsxExpression || node.type === "JSXExpressionContainer";
    if (Array.isArray(child)) child.forEach((item) => walk(item, file, nextInJsx));
    else walk(child, file, nextInJsx);
  });
};

roots.flatMap(filesUnder).forEach((file) => {
  const source = fs.readFileSync(file, "utf8");
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
  walk(ast, file);
});

if (found.size) {
  console.error(`Missing ${found.size} customer-service translations:\n`);
  [...found].sort(([a], [b]) => a.localeCompare(b)).forEach(([text, files]) => {
    console.error(`- ${JSON.stringify(text)} (${[...files].map((file) => path.basename(file)).join(", ")})`);
  });
  process.exitCode = 1;
} else {
  console.log("Customer-service UI translation audit passed.");
}
