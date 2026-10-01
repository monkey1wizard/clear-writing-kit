import { createLinter } from "textlint";
import { TextlintKernelDescriptor } from "@textlint/kernel";
import { loadLinterFormatter } from "textlint";
import { ruleModules } from "./rules.js";
import markdownPlugin from "@textlint/textlint-plugin-markdown";
import textPlugin from "@textlint/textlint-plugin-text";
import enDocument from "../writing/profiles/en-US.document.json";
import enConversation from "../writing/profiles/en-US.conversation.json";
import zhDocument from "../writing/profiles/zh-TW.document.json";
import zhConversation from "../writing/profiles/zh-TW.conversation.json";
import jaDocument from "../writing/profiles/ja-JP.document.json";
import jaConversation from "../writing/profiles/ja-JP.conversation.json";

const profiles: Record<string, any> = {
  "en-US.document": enDocument, "en-US.conversation": enConversation,
  "zh-TW.document": zhDocument, "zh-TW.conversation": zhConversation,
  "ja-JP.document": jaDocument, "ja-JP.conversation": jaConversation
};
const linters = new Map<string, ReturnType<typeof createLinter>>();
export let loadCounter = 0;

export async function lintText({ text, language, genre, filename = "input.md" }: { text: string; language: string; genre: string; filename?: string }) {
  if (!["en-US", "zh-TW", "ja-JP"].includes(language) || !["document", "conversation"].includes(genre)) throw new Error("Unknown language or genre");
  const key = `${language}.${genre}`;
  let linter = linters.get(key);
  if (!linter) {
    const profile = profiles[key];
    const rules = Object.entries(profile.rules).flatMap(([name, options]) => {
      const rule = ruleModules[name];
      if (!rule) throw new Error(`Unmapped rule: ${name}`);
      if (name === "preset-ja-technical-writing") {
        return Object.entries(options as Record<string, unknown>).map(([child, childOptions]) => {
          const childRule = rule.rules?.[child];
          if (!childRule) throw new Error(`Unmapped rule: ${name}/${child}`);
          return { ruleId: child, rule: childRule, options: childOptions as any };
        });
      }
      return { ruleId: name, rule, options: options as any };
    });
    if (!rules.length) throw new Error("Profile did not load any rules");
    const descriptor = new TextlintKernelDescriptor({ rules, filterRules: [], plugins: [
      { pluginId: "@textlint/textlint-plugin-text", plugin: textPlugin, options: true },
      { pluginId: "@textlint/textlint-plugin-markdown", plugin: markdownPlugin, options: true }
    ] });
    linter = createLinter({ descriptor, cwd: process.cwd() });
    linters.set(key, linter);
    loadCounter++;
  }
  const result = await linter.lintText(text, filename);
  const formatter = await loadLinterFormatter({ formatterName: "stylish" });
  return { result, output: formatter.format([result]) };
}
