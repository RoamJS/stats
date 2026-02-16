import type { ExtensionAPI, TagName } from "~/types/stats";

export const TAGS: readonly TagName[] = [
  "TODO",
  "DONE",
  "query",
  "embed",
  "table",
  "kanban",
  "video",
  "roam/js",
];

export const AUTO_LOAD_STATS_SETTING = "auto-load-stats";

export const formatInt = (n: number): string => n.toLocaleString();

export const getLoadingKeyForTag = (tag: TagName): string => `tag:${tag}`;

export const runAfterNextPaint = ({
  callback,
}: {
  callback: () => void;
}): void => {
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => callback());
    return;
  }

  window.setTimeout(() => callback(), 0);
};

export const getAutoLoadPreference = ({
  extensionAPI,
}: {
  extensionAPI: ExtensionAPI;
}): boolean => {
  const value = extensionAPI.settings.get(AUTO_LOAD_STATS_SETTING);
  return typeof value === "boolean" ? value : true;
};
