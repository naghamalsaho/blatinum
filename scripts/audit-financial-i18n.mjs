import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";

const root = "src/Rools/financial/pages";
const attributes = new Set(["placeholder", "title", "aria-label", "alt", "label", "note", "description"]);
const bridgeSource = fs.readFileSync("src/shared/i18n/usePageTranslation.js", "utf8");
const translations = new Set([...bridgeSource.matchAll(/"([^"]+)"\s*:/g)].map((match) => match[1].toLowerCase()));
const found = new Map();

const add = (value, file) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!/^[A-Z]/.test(text) || !/[a-z]{2}/.test(text) || translations.has(text.toLowerCase())) return;
  if (!found.has(text)) found.set(text, new Set());
  found.get(text).add(path.basename(file));
};
const walk = (node, file, inExpression = false) => {
  if (!node || typeof node !== "object") return;
  if (node.type === "JSXText") add(node.value, file);
  if (node.type === "JSXAttribute" && attributes.has(node.name?.name)) {
    if (node.value?.type === "StringLiteral") add(node.value.value, file);
    if (node.value?.type === "JSXExpressionContainer" && node.value.expression?.type === "StringLiteral") add(node.value.expression.value, file);
  }
  if (inExpression && node.type === "StringLiteral") add(node.value, file);
  if (inExpression && node.type === "TemplateLiteral") node.quasis.forEach((part) => add(part.value.cooked, file));
  Object.entries(node).forEach(([key, child]) => {
    if (["loc", "start", "end", "extra"].includes(key)) return;
    const next = inExpression || node.type === "JSXExpressionContainer";
    if (Array.isArray(child)) child.forEach((item) => walk(item, file, next));
    else walk(child, file, next);
  });
};

fs.readdirSync(root).filter((name) => name.endsWith(".jsx")).forEach((name) => {
  const file = path.join(root, name);
  walk(parse(fs.readFileSync(file, "utf8"), { sourceType: "module", plugins: ["jsx"] }), file);
});

if (found.size) {
  console.error(`Missing ${found.size} financial translations:\n`);
  [...found].sort(([a], [b]) => a.localeCompare(b)).forEach(([text, files]) => console.error(`- ${JSON.stringify(text)} (${[...files].join(", ")})`));
  process.exitCode = 1;
} else console.log("Financial UI translation audit passed.");
