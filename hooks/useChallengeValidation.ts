"use client";

import { useCallback } from "react";

export interface ValidationRule {
  selector: string;
  property: string;
  expected: string;
  hint: string;
}

export interface ValidationResult {
  passed: boolean;
  failedRule?: ValidationRule;
}

export const useChallengeValidation = () => {
  const validate = useCallback(
    (iframe: HTMLIFrameElement | null, rules: ValidationRule[]): ValidationResult => {
      if (!iframe || !iframe.contentWindow) {
        return { passed: false };
      }

      const doc = iframe.contentWindow.document;
      const win = iframe.contentWindow;

      for (const rule of rules) {
        const element = doc.querySelector(rule.selector);
        if (!element) {
          return {
            passed: false,
            failedRule: { ...rule, hint: `Element "${rule.selector}" not found.` },
          };
        }

        const computedStyle = win.getComputedStyle(element);

        // Convert camelCase to kebab-case (e.g., justifyContent -> justify-content)
        const kebabProperty = rule.property.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
        const actualValue = computedStyle.getPropertyValue(kebabProperty);

        // Normalization function
        const normalize = (val: string | null) => (val || "").toLowerCase().replace(/\s+/g, "");

        const normalizedActual = normalize(actualValue);
        const normalizedExpected = normalize(rule.expected);

        // Unit-aware check for relative units
        if (
          normalizedExpected.endsWith("vw") ||
          normalizedExpected.endsWith("vh") ||
          normalizedExpected.endsWith("%")
        ) {
          const expectedNum = parseFloat(normalizedExpected);
          const actualNum = parseFloat(normalizedActual); // Computed styles for dimensions are usually in px

          let expectedPx = 0;
          if (normalizedExpected.endsWith("vw")) {
            expectedPx = (expectedNum * win.innerWidth) / 100;
          } else if (normalizedExpected.endsWith("vh")) {
            expectedPx = (expectedNum * win.innerHeight) / 100;
          } else if (normalizedExpected.endsWith("%")) {
            const parent = element.parentElement || doc.body;
            const parentStyle = win.getComputedStyle(parent);
            const parentDim = parseFloat(
              parentStyle.getPropertyValue(kebabProperty === "width" ? "width" : "height"),
            );
            expectedPx = (expectedNum * parentDim) / 100;
          }

          // Allow a small margin of error (1px) for rounding
          if (Math.abs(actualNum - expectedPx) > 1) {
            return { passed: false, failedRule: rule };
          }
          continue;
        }

        if (normalizedActual !== normalizedExpected) {
          return {
            passed: false,
            failedRule: rule,
          };
        }
      }

      return { passed: true };
    },
    [],
  );

  return { validate };
};
