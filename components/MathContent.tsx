"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export function MathContent({ content, className = "" }: { content: string, className?: string }) {
    // Pre-process content to fix common LaTeX issues if necessary
    // E.g. replace \[ \] with $$ $$ if needed, but our prompt enforces $ and $$

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
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
