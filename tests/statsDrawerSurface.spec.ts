import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { buildSync } from "esbuild";
import { join } from "node:path";

const dom = new JSDOM("<!doctype html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});
const { window } = dom;
const { document } = window;
let root: HTMLDivElement;
Object.assign(globalThis, { document, window });
for (const name of Object.getOwnPropertyNames(window)) {
  if (!name.startsWith("_") && !(name in globalThis)) {
    Object.defineProperty(
      globalThis,
      name,
      Object.getOwnPropertyDescriptor(window, name)!,
    );
  }
}
const reactDOM: typeof import("react-dom") = require("react-dom");
// The bundled Playwright runner rewrites JSX for its own component renderer.
const compiledSurface = join(
  process.cwd(),
  "node_modules",
  ".stats-drawer-test.cjs",
);
buildSync({
  entryPoints: ["src/components/StatsDrawerSurface.tsx"],
  outfile: compiledSurface,
  format: "cjs",
});
const {
  StatsDrawerSurface,
}: typeof import("../src/components/StatsDrawerSurface") = require(
  compiledSurface,
);

const renderDrawer = ({ focusGraph = true } = {}): {
  close: HTMLButtonElement;
  graphControl: HTMLButtonElement;
} => {
  root = document.createElement("div");
  const graphControl = document.createElement("button");
  document.body.append(graphControl, root);
  if (focusGraph) graphControl.focus();
  reactDOM.render(
    createElement(StatsDrawerSurface, {
      isOpen: true,
      onClose: () => {
        reactDOM.unmountComponentAtNode(root);
      },
      children: "Metric content",
    }),
    root,
  );
  const close = document.querySelector<HTMLButtonElement>(
    '[aria-label="Close Stats"]',
  );
  if (!close) throw new Error("The Stats close button did not render");
  return { close, graphControl };
};

test.afterEach(() => {
  if (root) reactDOM.unmountComponentAtNode(root);
  document.body.replaceChildren();
});

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

test("preserves active graph focus after opening and allows outside clicks", async () => {
  const { close, graphControl } = renderDrawer();
  await nextFrame();
  expect(document.activeElement).toBe(graphControl);
  close.focus();
  graphControl.focus();
  graphControl.dispatchEvent(
    new window.MouseEvent("mousedown", { bubbles: true }),
  );

  expect(document.activeElement).toBe(graphControl);
  expect(close.isConnected).toBe(true);
  expect(document.querySelector(".bp3-overlay-backdrop")).toBeNull();
});

test("restores focus when closing from the drawer", () => {
  const { close, graphControl } = renderDrawer();
  close.focus();
  close.click();

  expect(close.isConnected).toBe(false);
  expect(document.activeElement).toBe(graphControl);
});

test("focuses the close button when no graph control holds focus", async () => {
  const { close } = renderDrawer({ focusGraph: false });
  await nextFrame();
  await nextFrame();

  expect(document.activeElement).toBe(close);
});
