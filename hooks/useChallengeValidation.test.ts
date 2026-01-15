import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useChallengeValidation, ValidationRule } from "./useChallengeValidation";

describe("useChallengeValidation", () => {
  it("should validate a correct style", () => {
    const { result } = renderHook(() => useChallengeValidation());
    const { validate } = result.current;

    // Mock iframe and window
    const mockGetComputedStyle = vi.fn(() => ({
      getPropertyValue: (prop: string) => {
        if (prop === "display") return "flex";
        return "";
      },
    }));

    const mockDoc = {
      querySelector: vi.fn(() => ({})), // Element exists
    };

    const mockWindow = {
      document: mockDoc,
      getComputedStyle: mockGetComputedStyle,
      innerWidth: 1000,
      innerHeight: 800,
    };

    const mockIframe = {
      contentWindow: mockWindow,
    } as unknown as HTMLIFrameElement;

    const rules: ValidationRule[] = [
      {
        selector: ".container",
        property: "display",
        expected: "flex",
        hint: "Display should be flex",
      },
    ];

    const validationResult = validate(mockIframe, rules);

    expect(validationResult.passed).toBe(true);
    expect(mockDoc.querySelector).toHaveBeenCalledWith(".container");
    expect(mockGetComputedStyle).toHaveBeenCalled();
  });

  it("should fail on incorrect style", () => {
    const { result } = renderHook(() => useChallengeValidation());
    const { validate } = result.current;

    const mockGetComputedStyle = vi.fn(() => ({
      getPropertyValue: (prop: string) => {
        if (prop === "display") return "block"; // Wrong value
        return "";
      },
    }));

    const mockWindow = {
      document: { querySelector: vi.fn(() => ({})) },
      getComputedStyle: mockGetComputedStyle,
    };

    const mockIframe = {
      contentWindow: mockWindow,
    } as unknown as HTMLIFrameElement;

    const rules: ValidationRule[] = [
      {
        selector: ".container",
        property: "display",
        expected: "flex",
        hint: "Display should be flex",
      },
    ];

    const validationResult = validate(mockIframe, rules);

    expect(validationResult.passed).toBe(false);
    expect(validationResult.failedRule).toEqual(rules[0]);
  });

  it("should fail if element is missing", () => {
    const { result } = renderHook(() => useChallengeValidation());
    const { validate } = result.current;

    const mockWindow = {
      document: { querySelector: vi.fn(() => null) }, // Element missing
    };

    const mockIframe = {
      contentWindow: mockWindow,
    } as unknown as HTMLIFrameElement;

    const rules: ValidationRule[] = [
      { selector: ".missing", property: "display", expected: "flex", hint: "fail" },
    ];

    const validationResult = validate(mockIframe, rules);

    expect(validationResult.passed).toBe(false);
    expect(validationResult.failedRule?.hint).toContain('Element ".missing" not found');
  });

  it("should handle pixel values and normalization", () => {
    const { result } = renderHook(() => useChallengeValidation());
    const { validate } = result.current;

    const mockGetComputedStyle = vi.fn(() => ({
      getPropertyValue: (prop: string) => {
        if (prop === "font-size") return "16px";
        return "";
      },
    }));

    const mockWindow = {
      document: { querySelector: vi.fn(() => ({})) },
      getComputedStyle: mockGetComputedStyle,
    };

    const mockIframe = {
      contentWindow: mockWindow,
    } as unknown as HTMLIFrameElement;

    // Expected "16px" should match "16px"
    const rules: ValidationRule[] = [
      { selector: "h1", property: "fontSize", expected: "16px", hint: "Size 16px" },
    ];

    const validationResult = validate(mockIframe, rules);
    expect(validationResult.passed).toBe(true);
  });
});
