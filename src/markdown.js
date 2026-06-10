import hljs from "highlight.js";
import MarkdownIt from "markdown-it";

function plainText(tokens, index) {
  const inline = tokens[index + 1];
  return inline?.type === "inline" ? inline.content : "";
}

function slugify(text) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return slug || "section";
}

export function renderMarkdown(source) {
  const toc = [];
  const slugCounts = new Map();
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight(code, language) {
      const known = language && hljs.getLanguage(language);
      const highlighted = known
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value;
      const className = known ? ` language-${language}` : "";
      return `<pre><code class="hljs${className}">${highlighted}</code></pre>`;
    }
  });

  markdown.core.ruler.push("collect_headings", (state) => {
    state.tokens.forEach((token, index) => {
      if (token.type !== "heading_open") {
        return;
      }
      const level = Number(token.tag.slice(1));
      if (level < 2 || level > 3) {
        return;
      }
      const text = plainText(state.tokens, index);
      const base = slugify(text);
      const count = (slugCounts.get(base) ?? 0) + 1;
      slugCounts.set(base, count);
      const id = count === 1 ? base : `${base}-${count}`;
      token.attrSet("id", id);
      toc.push({ level, id, text });
    });
  });

  return {
    html: markdown.render(source),
    toc
  };
}
