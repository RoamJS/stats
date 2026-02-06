import React, { useState, useEffect } from "react";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import { Drawer, Classes } from "@blueprintjs/core";

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

type Stats = {
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
};

const STATS_DRAWER_ID = "roamjs-stats-drawer";

const baseQueries = [
  queryPages,
  queryNonCodeBlocks,
  queryNonCodeBlockWords,
  queryNonCodeBlockCharacters,
  queryBlockquotes,
  queryBlockquotesWords,
  queryBlockquotesCharacters,
  queryCodeBlocks,
  queryCodeBlockCharacters,
  queryInterconnections,
  queryFireBaseAttachements,
  queryExternalLinks,
];

const loadStats = async (): Promise<Stats> => {
  const results = await Promise.all([
    ...baseQueries.map(runQuery),
    ...TAGS.map((tag) => runQuery(queryTagRefs(tag))),
  ]);

  const tagOffset = baseQueries.length;
  const tagCounts: Record<string, number> = {};
  TAGS.forEach((tag, i) => {
    tagCounts[tag] = scalar(results[tagOffset + i]);
  });

  return {
    pages: scalar(results[0]),
    nonCodeBlocks: scalar(results[1]),
    nonCodeBlockWords: scalar(results[2]),
    nonCodeBlockChars: scalar(results[3]),
    blockquotes: scalar(results[4]),
    blockquotesWords: scalar(results[5]),
    blockquotesChars: scalar(results[6]),
    codeBlocks: scalar(results[7]),
    codeBlockChars: scalar(results[8]),
    interconnections: scalar(results[9]),
    tagCounts,
    firebaseLinks: scalar(results[10]),
    externalLinks: scalar(results[11]),
  };
};

export const StatsDrawer = ({ onClose, isOpen }: RoamOverlayProps<{}>) => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadStats()
      .then(setStats)
      .catch(() => setStats(null));
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
        {!stats ? (
          <p>Loading stats...</p>
        ) : (
          <>
            <p>Pages: {stats.pages}</p>
            <p>
              Text Blocks / Words / Characters: <br />
              {stats.nonCodeBlocks} / {stats.nonCodeBlockWords} /{" "}
              {stats.nonCodeBlockChars}
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
              {stats.blockquotes} / {stats.blockquotesWords} /{" "}
              {stats.blockquotesChars}
            </p>
            <p>
              Code Blocks / Characters:
              <br />
              {stats.codeBlocks} / {stats.codeBlockChars}
            </p>
            <p>
              Interconnections (refs): {stats.interconnections}
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
                  : {stats.tagCounts[tag] ?? 0}
                </span>
              ))}
            </p>
            <p>
              Firebase Links: {stats.firebaseLinks}
              <br />
              External Links: {stats.externalLinks}
            </p>
          </>
        )}
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
