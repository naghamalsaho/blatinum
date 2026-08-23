import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";

const scopes = {
  marketing: "src/Rools/marketing/pages",
  legal: "src/Rools/legal/pages",
};
const attributes = new Set(["placeholder", "title", "aria-label", "alt", "label", "note", "description"]);
const bridgeSource = fs.readFileSync("src/shared/i18n/usePageTranslation.js", "utf8");
const translations = new Set([...bridgeSource.matchAll(/"([^"]+)"\s*:/g)].map((match) => match[1].toLowerCase()));

const audit = (scope, root) => {
  const found = new Map();
  const files = fs.readdirSync(root).filter((name) => name.endsWith(".jsx")).map((name) => path.join(root, name));
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
  files.forEach((file) => walk(parse(fs.readFileSync(file, "utf8"), { sourceType: "module", plugins: ["jsx"] }), file));
  if (found.size) {
    console.error(`Missing ${found.size} ${scope} translations:\n`);
    [...found].sort(([a], [b]) => a.localeCompare(b)).forEach(([text, sources]) => console.error(`- ${JSON.stringify(text)} (${[...sources].join(", ")})`));
    return false;
  }
  console.log(`${scope[0].toUpperCase()}${scope.slice(1)} UI translation audit passed.`);
  return true;
};

const results = Object.entries(scopes).map(([scope, root]) => audit(scope, root));
if (results.some((result) => !result)) process.exitCode = 1;
