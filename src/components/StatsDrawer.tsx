import React from "react";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import { Drawer, Classes } from "@blueprintjs/core";

import {
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
} from "../utils/queries";

const STATS_DRAWER_ID = "roamjs-stats-drawer";

export const StatsDrawer = ({ onClose, isOpen }: RoamOverlayProps<{}>) => {
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
        <p>
          Pages:{" "}
          {window.roamAlphaAPI.q(queryPages)[0]}
        </p>
        <p>
          Text Blocks / Words / Characters: <br />
          {window.roamAlphaAPI.q(queryNonCodeBlocks)} /
          {window.roamAlphaAPI.q(queryNonCodeBlockWords)} /
          {window.roamAlphaAPI.q(queryNonCodeBlockCharacters)}
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
          {window.roamAlphaAPI.q(queryBlockquotes)} /{" "}
          {window.roamAlphaAPI.q(queryBlockquotesWords)} /{" "}
          {window.roamAlphaAPI.q(queryBlockquotesCharacters)}
        </p>
        <p>
          Code Blocks / Characters:
          <br />
          {window.roamAlphaAPI.q(queryCodeBlocks)} /
          {window.roamAlphaAPI.q(queryCodeBlockCharacters)}
        </p>
        <p>
          Interconnections (refs):
          {window.roamAlphaAPI.q(queryInterconnections)}
        </p>
        <p className="flex flex-col">
          {[
            "TODO",
            "DONE",
            "query",
            "embed",
            "table",
            "kanban",
            "video",
            "roam/js",
          ].map((tag) => (
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
              {window.roamAlphaAPI.q(queryTagRefs(tag)) || 0}
            </span>
          ))}
        </p>
        <p>
          Firebase Links:{" "}
          {window.roamAlphaAPI.q(queryFireBaseAttachements) || 0}
          <br />
          External Links: {window.roamAlphaAPI.q(queryExternalLinks) || 0}
        </p>
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
