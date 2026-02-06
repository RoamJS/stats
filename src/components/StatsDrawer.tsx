import React, { useState, useEffect } from "react";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import {
  Card,
  Classes,
  Drawer,
  H4,
  H6,
  HTMLTable,
  Icon,
  Intent,
  Spinner,
  Tag,
} from "@blueprintjs/core";

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

const formatInt = (n: number) => n.toLocaleString();

const Loader = () => (
  <span className="inline-block align-middle">
    <Spinner size={14} />
  </span>
);

type MetricProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentProps<typeof Icon>["icon"];
};

const Metric = ({ label, value, icon }: MetricProps) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 opacity-75">
      <Icon icon={icon} size={14} />
      <span className={Classes.TEXT_SMALL}>{label}</span>
    </div>
    <span className="font-semibold tabular-nums">{value}</span>
  </div>
);

export const StatsDrawer = ({ onClose, isOpen }: RoamOverlayProps<{}>) => {
  const [stats, setStats] = useState<Stats>({});

  useEffect(() => {
    if (!isOpen) return;
    setStats({});

    const timer = setTimeout(() => {
      const queries = [
        { key: "pages" as const, query: queryPages },
        { key: "nonCodeBlocks" as const, query: queryNonCodeBlocks },
        { key: "nonCodeBlockWords" as const, query: queryNonCodeBlockWords },
        {
          key: "nonCodeBlockChars" as const,
          query: queryNonCodeBlockCharacters,
        },
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
            })),
          )
          .catch(() =>
            setStats((prev) => ({
              ...prev,
              tagCounts: { ...(prev.tagCounts ?? {}), [tag]: 0 },
            })),
          );
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <Drawer
      onClose={onClose}
      isOpen={isOpen}
      title={
        <div className="flex items-center gap-2.5">
          <Icon icon="database" />
          <span>Stats</span>
        </div>
      }
      position="right"
      hasBackdrop={false}
      canOutsideClickClose={false}
      style={{ width: 760, maxWidth: "95vw" }}
      portalClassName="pointer-events-none"
      className="roamjs-stats-drawer pointer-events-auto"
      enforceFocus={false}
      autoFocus={false}
    >
      <div className={Classes.DRAWER_BODY}>
        <div className="p-3">
          {/* Top overview */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            <Card elevation={1} className="p-3">
              <Metric
                label="Pages"
                value={
                  stats.pages != null ? formatInt(stats.pages) : <Loader />
                }
                icon="document"
              />
            </Card>
            <Card elevation={1} className="p-3">
              <Metric
                label="Interconnections"
                value={
                  stats.interconnections != null ? (
                    formatInt(stats.interconnections)
                  ) : (
                    <Loader />
                  )
                }
                icon="link"
              />
            </Card>
            <Card elevation={1} className="p-3">
              <Metric
                label="Firebase links"
                value={
                  stats.firebaseLinks != null ? (
                    formatInt(stats.firebaseLinks)
                  ) : (
                    <Loader />
                  )
                }
                icon="cloud"
              />
            </Card>
            <Card elevation={1} className="p-3">
              <Metric
                label="External links"
                value={
                  stats.externalLinks != null ? (
                    formatInt(stats.externalLinks)
                  ) : (
                    <Loader />
                  )
                }
                icon="share"
              />
            </Card>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-3 mt-3">
            {/* Content breakdown */}

            <div className="grid grid-cols-3 gap-3 min-w-0">
              <Card elevation={1} className="p-2.5 bg-black/10">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="paragraph" />
                  <H6 className="m-0">Text blocks</H6>
                </div>
                <HTMLTable condensed striped={false} className="w-full">
                  <tbody>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Blocks
                      </td>
                      <td className="text-right tabular-nums">
                        {stats.nonCodeBlocks != null ? (
                          formatInt(stats.nonCodeBlocks)
                        ) : (
                          <Loader />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Words
                      </td>
                      <td className="text-right tabular-nums">
                        {stats.nonCodeBlockWords != null ? (
                          formatInt(stats.nonCodeBlockWords)
                        ) : (
                          <Loader />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Characters
                      </td>
                      <td className="text-right tabular-nums">
                        {stats.nonCodeBlockChars != null ? (
                          formatInt(stats.nonCodeBlockChars)
                        ) : (
                          <Loader />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </HTMLTable>
              </Card>

              <Card elevation={1} className="p-2.5 bg-black/10">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="citation" />
                  <H6 className="m-0">Block quotes</H6>
                </div>
                <HTMLTable condensed striped={false} className="w-full">
                  <tbody>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Quotes
                      </td>
                      <td className="text-right tabular-nums">
                        {stats.blockquotes != null ? (
                          formatInt(stats.blockquotes)
                        ) : (
                          <Loader />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Words
                      </td>
                      <td className="text-right tabular-nums">
                        {stats.blockquotesWords != null ? (
                          formatInt(stats.blockquotesWords)
                        ) : (
                          <Loader />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Characters
                      </td>
                      <td className="text-right tabular-nums">
                        {stats.blockquotesChars != null ? (
                          formatInt(stats.blockquotesChars)
                        ) : (
                          <Loader />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </HTMLTable>
              </Card>

              <Card elevation={1} className="p-2.5 bg-black/10">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="code" />
                  <H6 className="m-0">Code blocks</H6>
                </div>
                <HTMLTable condensed striped={false} className="w-full">
                  <tbody>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Blocks
                      </td>
                      <td className="text-right tabular-nums">
                        {stats.codeBlocks != null ? (
                          formatInt(stats.codeBlocks)
                        ) : (
                          <Loader />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Characters
                      </td>
                      <td className="text-right tabular-nums">
                        {stats.codeBlockChars != null ? (
                          formatInt(stats.codeBlockChars)
                        ) : (
                          <Loader />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </HTMLTable>
              </Card>
            </div>

            {/* Block types */}
            <Card elevation={1} className="p-3">
              <H4 className="mt-0 mb-2">Block types</H4>

              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <Tag
                    key={tag}
                    interactive
                    intent={
                      tag === "TODO"
                        ? Intent.WARNING
                        : tag === "DONE"
                          ? Intent.SUCCESS
                          : Intent.NONE
                    }
                    onClick={() =>
                      window.roamAlphaAPI.ui.mainWindow.openPage({
                        page: { title: tag },
                      })
                    }
                    className="cursor-pointer"
                  >
                    <span className="opacity-90">{tag}</span>{" "}
                    <span className="font-bold">
                      {stats.tagCounts?.[tag] != null ? (
                        formatInt(stats.tagCounts[tag])
                      ) : (
                        <Loader />
                      )}
                    </span>
                  </Tag>
                ))}
              </div>
            </Card>
            {/* Account */}
            <Card elevation={1} className="p-3">
              <H4 className="m-0 opacity-80">Account</H4>
              <div className="mt-2 grid gap-1.5">
                <div className="flex justify-between gap-2">
                  <span className={`${Classes.TEXT_SMALL} opacity-75`}>
                    Display name
                  </span>
                  <span className="tabular-nums">
                    {getCurrentUserDisplayName()}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className={`${Classes.TEXT_SMALL} opacity-75`}>
                    Email
                  </span>
                  <span className="tabular-nums">{getCurrentUserEmail()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
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
