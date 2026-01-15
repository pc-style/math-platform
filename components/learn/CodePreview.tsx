"use client";

import React, { useEffect, useRef } from "react";

interface CodePreviewProps {
  html: string;
  css: string;
  js?: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ html, css, js }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const updateIframe = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const combinedCode = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                margin: 0; 
                padding: 1rem; 
                font-family: sans-serif; 
                background: #fbfaf5; 
                color: #2d2a2e;
                min-height: 100vh;
                display: block;
              }
              ${css}
            </style>
          </head>
          <body>
            ${html}
            <script>
              try {
                ${js || ""}
              } catch (err) {
                console.error('Preview Error:', err);
              }
            </script>
          </body>
        </html>
      `;

      iframe.srcdoc = combinedCode;
    };

    const timeoutId = setTimeout(updateIframe, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [html, css, js]);

  return (
    <div className="w-full h-full glass border border-white/10 rounded-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-8 bg-black/20 flex items-center px-4 border-b border-white/5 z-10">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          Live Preview
        </span>
      </div>
      <iframe
        ref={iframeRef}
        title="Live Code Challenge Preview"
        className="w-full h-full border-none pt-8"
        sandbox="allow-scripts"
      />
    </div>
  );
};
