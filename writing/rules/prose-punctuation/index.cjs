// Original project rule. Check prose only. Never auto-fix protected content.
module.exports = function (context) {
  const { Syntax, RuleError, report, getSource } = context;
  let protectedDepth = 0;
  const handlers = {};
  for (const kind of [Syntax.BlockQuote, Syntax.Link, Syntax.Image]) {
    handlers[kind] = () => { protectedDepth++; };
    handlers[kind + ":exit"] = () => { protectedDepth--; };
  }
  handlers[Syntax.Str] = (node) => {
    if (protectedDepth) return;
    const source = getSource(node);
    for (const match of source.matchAll(/[;；—]/gu)) {
      report(node, new RuleError("Use a period or rewrite the prose. Preserve quoted literals.", { index: match.index }));
    }
  };
  return handlers;
};
