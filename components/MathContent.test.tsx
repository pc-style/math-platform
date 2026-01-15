import { render, screen } from "@testing-library/react";
import { MathContent } from "./MathContent";
import { expect, test } from "vitest";

test("renders math content", () => {
  render(<MathContent content="Test content with $x^2$" />);
  expect(screen.getByText(/Test content/)).toBeDefined();
});

test("renders GraphTraverser via fenced code slug", () => {
  render(
    <MathContent
      content={["Here is an interactive demo:", "", "```graph-traverser", "```", ""].join("\n")}
    />,
  );

  expect(screen.getByText("Graph Traverser")).toBeDefined();
});

test("renders MatrixTransform via MDX-like shortcode", () => {
  render(<MathContent content={"<MatrixTransform />"} />);
  expect(screen.getByText("Matrix Transform")).toBeDefined();
});

test("renders interactive widget via fenced code", () => {
  render(
    <MathContent
      content={[
        "```interactive",
        JSON.stringify({ kind: "dot2D", title: "Dot Product Lab", u: [1, 0], v: [0, 1] }),
        "```",
      ].join("\n")}
    />,
  );

  expect(screen.getByText("Dot Product Lab")).toBeDefined();
});
