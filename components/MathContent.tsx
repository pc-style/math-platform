"use client";

import React, { type ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  GraphTraverser,
  graphTraverserConfigFromUnknown,
} from "@/components/visualizers/GraphTraverser";
import {
  MatrixTransform,
  matrixTransformConfigFromUnknown,
} from "@/components/visualizers/MatrixTransform";
import { InteractiveBlock } from "@/components/learn/interactive/math/InteractiveBlock";

type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & ExtraProps & { inline?: boolean };

function parseLooseConfig(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }

  const obj: Record<string, unknown> = {};
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim());
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const kv = line.includes(":") ? line.split(":") : line.split("=");
    if (kv.length < 2) continue;
    const key = kv[0].trim();
    const rawValue = kv
      .slice(1)
      .join(line.includes(":") ? ":" : "=")
      .trim();
    if (!key) continue;

    let value: unknown = rawValue;
    if (rawValue === "true") value = true;
    else if (rawValue === "false") value = false;
    else if (rawValue !== "" && !Number.isNaN(Number(rawValue))) value = Number(rawValue);

    obj[key] = value;
  }
  return obj;
}

function normalizeVisualizerShortcodes(content: string) {
  // Minimal “MDX-like” support for embedded components in markdown strings.
  return content
    .replaceAll(/<GraphTraverser\s*\/>/g, "```graph-traverser\n```")
    .replaceAll(/<GraphTraverser>\s*<\/GraphTraverser>/g, "```graph-traverser\n```")
    .replaceAll(/<MatrixTransform\s*\/>/g, "```matrix-transform\n```")
    .replaceAll(/<MatrixTransform>\s*<\/MatrixTransform>/g, "```matrix-transform\n```")
    .replaceAll(/\[\[\s*graph-traverser\s*\]\]/gi, "```graph-traverser\n```")
    .replaceAll(/\[\[\s*matrix-transform\s*\]\]/gi, "```matrix-transform\n```");
}

export function MathContent({
  content,
  className = "",
  slug,
}: {
  content: string;
  className?: string;
  slug?: string;
}) {
  // Pre-process content to fix common LaTeX issues if necessary
  // E.g. replace \[ \] with $$ $$ if needed, but our prompt enforces $ and $$

  const normalized = normalizeVisualizerShortcodes(content);
  const shouldInject = slug === "graph-traverser" || slug === "matrix-transform";
  const alreadyHasFence = shouldInject
    ? new RegExp(String.raw`(^|\n)\`\`\`${slug}(\s|$)`, "m").test(normalized)
    : false;
  const maybeInjected =
    shouldInject && !alreadyHasFence ? `${normalized}\n\n\`\`\`${slug}\n\`\`\`\n` : normalized;

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <span className="block mb-4 leading-relaxed">{children}</span>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-2 mb-4">{children}</ol>,
          pre: ({ children }) => {
            const onlyChild = Array.isArray(children) ? children[0] : children;
            if (
              React.isValidElement(onlyChild) &&
              (onlyChild.type === GraphTraverser ||
                onlyChild.type === MatrixTransform ||
                onlyChild.type === InteractiveBlock)
            ) {
              return <>{onlyChild}</>;
            }
            return (
              <pre className="glass border border-white/10 rounded-xl p-4 overflow-x-auto bg-black/40">
                {children}
              </pre>
            );
          },
          code: (props: MarkdownCodeProps) => {
            const { children, className: codeClassName, node, inline, ...rest } = props;
            void node;
            void inline;
            const langMatch = /language-([^\s]+)/.exec(codeClassName || "");
            const language = langMatch?.[1];
            const raw = String(children ?? "").replace(/\n$/, "");

            if (language === "interactive") {
              return <InteractiveBlock raw={raw} />;
            }

            const slugFromFence =
              language === "visualizer" ? raw.split(/\r?\n/)[0].trim() : (language ?? "").trim();
            const configText =
              language === "visualizer"
                ? raw.split(/\r?\n/).slice(1).join("\n").trim()
                : raw.trim();

            const visualizerSlug = slugFromFence;
            const config = parseLooseConfig(configText);

            if (visualizerSlug === "graph-traverser") {
              return <GraphTraverser {...graphTraverserConfigFromUnknown(config)} />;
            }
            if (visualizerSlug === "matrix-transform") {
              return <MatrixTransform {...matrixTransformConfigFromUnknown(config)} />;
            }

            return (
              <code {...rest} className={codeClassName}>
                {children}
              </code>
            );
          },
        }}
      >
        {maybeInjected}
      </ReactMarkdown>
    </div>
  );
}
