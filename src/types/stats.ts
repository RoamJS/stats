import type { OnloadArgs } from "roamjs-components/types/native";

export type ExtensionAPI = OnloadArgs["extensionAPI"];

export type TagName =
  | "TODO"
  | "DONE"
  | "query"
  | "embed"
  | "table"
  | "kanban"
  | "video"
  | "roam/js";

export type StatMetricKey =
  | "pages"
  | "nonCodeBlocks"
  | "nonCodeBlockWords"
  | "nonCodeBlockChars"
  | "blockquotes"
  | "blockquotesWords"
  | "blockquotesChars"
  | "codeBlocks"
  | "codeBlockChars"
  | "interconnections"
  | "firebaseLinks"
  | "externalLinks";

export type Stats = Partial<Record<StatMetricKey, number>> & {
  tagCounts?: Partial<Record<TagName, number>>;
};

export type LoadingState = Record<string, boolean>;
