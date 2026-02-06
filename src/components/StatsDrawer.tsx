import React, { useState, useEffect } from "react";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import { Drawer, Classes, Spinner } from "@blueprintjs/core";

import { scalar } from "~/utils/scalar";
import {
  runQuery,
  queryPages,
  queryNonCodeBlocks,
  queryNonCodeBlockWords,
  queryNonCodeBlockCharacters,
  queryCodeBlocks,
  queryCodeBlockCharacters,
  queryBlockquotes,
  queryBlockquotesWords,
  queryBlockquotesCharacters,
  queryInterconnections,
  queryTagRefs,
  queryFireBaseAttachements,
  queryExternalLinks,
} from "~/utils/queries";

const TAGS = [
  "TODO",
  "DONE",
  "query",
  "embed",
  "table",
  "kanban",
  "video",
  "roam/js",
];

type Stats = Partial<{
  pages: number;
  nonCodeBlocks: number;
  nonCodeBlockWords: number;
  nonCodeBlockChars: number;
  blockquotes: number;
  blockquotesWords: number;
  blockquotesChars: number;
  codeBlocks: number;
  codeBlockChars: number;
  interconnections: number;
  tagCounts: Record<string, number>;
  firebaseLinks: number;
  externalLinks: number;
}>;

const STATS_DRAWER_ID = "roamjs-stats-drawer";

const Loader = () => (
  <span className="inline-block align-middle">
    <Spinner size={14} />
  </span>
);

export const StatsDrawer = ({ onClose, isOpen }: RoamOverlayProps<{}>) => {
  const [stats, setStats] = useState<Stats>({});

  useEffect(() => {
    if (!isOpen) return;
    setStats({});

    // Defer queries so drawer paints first
    const timer = setTimeout(() => {
      const queries = [
      { key: "pages" as const, query: queryPages },
      { key: "nonCodeBlocks" as const, query: queryNonCodeBlocks },
      { key: "nonCodeBlockWords" as const, query: queryNonCodeBlockWords },
      { key: "nonCodeBlockChars" as const, query: queryNonCodeBlockCharacters },
      { key: "blockquotes" as const, query: queryBlockquotes },
      { key: "blockquotesWords" as const, query: queryBlockquotesWords },
      { key: "blockquotesChars" as const, query: queryBlockquotesCharacters },
      { key: "codeBlocks" as const, query: queryCodeBlocks },
      { key: "codeBlockChars" as const, query: queryCodeBlockCharacters },
      { key: "interconnections" as const, query: queryInterconnections },
      { key: "firebaseLinks" as const, query: queryFireBaseAttachements },
      { key: "externalLinks" as const, query: queryExternalLinks },
    ];

    queries.forEach(({ key, query }) => {
      runQuery(query)
        .then((r) => setStats((prev) => ({ ...prev, [key]: scalar(r) })))
        .catch(() => setStats((prev) => ({ ...prev, [key]: 0 })));
    });

    TAGS.forEach((tag) => {
      runQuery(queryTagRefs(tag))
        .then((r) =>
          setStats((prev) => ({
            ...prev,
            tagCounts: { ...(prev.tagCounts ?? {}), [tag]: scalar(r) },
          }))
        )
        .catch(() =>
          setStats((prev) => ({
            ...prev,
            tagCounts: { ...(prev.tagCounts ?? {}), [tag]: 0 },
          }))
        );
    });
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <Drawer
      onClose={onClose}
      isOpen={isOpen}
      title={"Graph Database stats"}
      position={"right"}
      hasBackdrop={false}
      canOutsideClickClose={false}
      style={{ width: 400 }}
      portalClassName={"pointer-events-none"}
      className={"roamjs-stats-drawer pointer-events-auto"}
      enforceFocus={false}
      autoFocus={false}
    >
      <div
        className={`${Classes.DRAWER_BODY} p-5 text-white text-opacity-70`}
        style={{ background: "#565c70" }}
      >
        <style>{`.roamjs-stats-drawer .bp3-drawer-header { 
  background: #565c70;
}

.roamjs-stats-drawer .bp3-drawer-header .bp3-heading {
  color: white; 
  opacity: 0.7; 
}`}</style>
        <>
          <p>
            Pages: {stats.pages != null ? stats.pages : <Loader />}
          </p>
          <p>
            Text Blocks / Words / Characters: <br />
            {stats.nonCodeBlocks != null ? stats.nonCodeBlocks : <Loader />} /{" "}
            {stats.nonCodeBlockWords != null ? stats.nonCodeBlockWords : <Loader />} /{" "}
            {stats.nonCodeBlockChars != null ? stats.nonCodeBlockChars : <Loader />}
          </p>
          <p>
            <a
              style={{ color: "lightgrey" }}
              onClick={() =>
                window.roamAlphaAPI.ui.mainWindow.openPage({
                  page: { title: ">" },
                })
              }
            >
              Block Quotes
            </a>{" "}
            / Words / Characters: <br />
            {stats.blockquotes != null ? stats.blockquotes : <Loader />} /{" "}
            {stats.blockquotesWords != null ? stats.blockquotesWords : <Loader />} /{" "}
            {stats.blockquotesChars != null ? stats.blockquotesChars : <Loader />}
          </p>
          <p>
            Code Blocks / Characters:
            <br />
            {stats.codeBlocks != null ? stats.codeBlocks : <Loader />} /{" "}
            {stats.codeBlockChars != null ? stats.codeBlockChars : <Loader />}
          </p>
          <p>
            Interconnections (refs):{" "}
            {stats.interconnections != null ? stats.interconnections : <Loader />}
          </p>
          <p className="flex flex-col">
            {TAGS.map((tag) => (
              <span key={tag}>
                <a
                  style={{ color: "lightgrey" }}
                  onClick={() =>
                    window.roamAlphaAPI.ui.mainWindow.openPage({
                      page: { title: tag },
                    })
                  }
                >
                  {tag}
                </a>
                :{" "}
                {stats.tagCounts?.[tag] != null ? stats.tagCounts[tag] : <Loader />}
              </span>
            ))}
          </p>
          <p>
            Firebase Links:{" "}
            {stats.firebaseLinks != null ? stats.firebaseLinks : <Loader />}
            <br />
            External Links:{" "}
            {stats.externalLinks != null ? stats.externalLinks : <Loader />}
          </p>
        </>
        <p>
          Display Name: {getCurrentUserDisplayName()}
          <br />
          Email: {getCurrentUserEmail()}
          <br />
        </p>
      </div>
    </Drawer>
  );
};

let closeStatsDrawer: (() => void) | null = null;

export const toggleStatsDrawer = () => {
  if (document.getElementById(STATS_DRAWER_ID)) {
    closeStatsDrawer?.();
    closeStatsDrawer = null;
  } else {
    closeStatsDrawer =
      renderOverlay({
        id: STATS_DRAWER_ID,
        Overlay: StatsDrawer,
      }) ?? null;
  }
};
