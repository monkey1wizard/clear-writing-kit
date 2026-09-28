// Supplement the pinned no-mix classifier. Never rewrite a sentence automatically.
module.exports = function (context) {
  const { Syntax, RuleError, report, getSource } = context;
  let protectedDepth = 0;
  const handlers = {};
  for (const kind of [Syntax.BlockQuote, Syntax.Link, Syntax.Image]) {
    handlers[kind] = () => { protectedDepth++; };
    handlers[kind + ":exit"] = () => { protectedDepth--; };
  }
  handlers[Syntax.Header] = (node) => {
    if (protectedDepth) return;
    const source = getSource(node).trimEnd();
    if (/[。.]$/.test(source)) {
      report(node, new RuleError("Omit the final period in a Japanese heading.", { index: source.length - 1 }));
    }
  };
  handlers[Syntax.Str] = (node) => {
    if (protectedDepth) return;
    const source = getSource(node);
    const quoted = new Set();
    const closing = [];
    for (let i = 0; i < source.length; i++) {
      if (source[i] === "「") closing.push("」");
      else if (source[i] === "『") closing.push("』");
      if (closing.length) quoted.add(i);
      if (source[i] === closing[closing.length - 1]) closing.pop();
    }
    for (const match of source.matchAll(/(?:ません(?:でした)?|ました|でした|でしょう|ましょう|ください)(?=[。.!?！？]|$)/gu)) {
      if (quoted.has(match.index)) continue;
      report(node, new RuleError("Use a plain-form sentence in Japanese documents. Preserve negation and uncertainty.", { index: match.index }));
    }
  };
  return handlers;
};
