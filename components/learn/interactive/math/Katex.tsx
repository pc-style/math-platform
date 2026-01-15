"use client";

import katex from "katex";

export function Katex({
  latex,
  displayMode = false,
  className,
}: {
  latex: string;
  displayMode?: boolean;
  className?: string;
}) {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode,
    output: "htmlAndMathml",
  });

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
