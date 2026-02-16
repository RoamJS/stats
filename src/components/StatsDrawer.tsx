import React, { useCallback, useEffect, useRef, useState } from "react";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import {
  Button,
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
  formatInt,
  getAutoLoadPreference,
  getLoadingKeyForTag,
  runAfterNextPaint,
  TAGS,
} from "~/utils/stats";
import type {
  ExtensionAPI,
  LoadingState,
  StatMetricKey,
  Stats,
  TagName,
} from "~/types/stats";
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

const STAT_QUERIES: Record<StatMetricKey, string> = {
  pages: queryPages,
  nonCodeBlocks: queryNonCodeBlocks,
  nonCodeBlockWords: queryNonCodeBlockWords,
  nonCodeBlockChars: queryNonCodeBlockCharacters,
  blockquotes: queryBlockquotes,
  blockquotesWords: queryBlockquotesWords,
  blockquotesChars: queryBlockquotesCharacters,
  codeBlocks: queryCodeBlocks,
  codeBlockChars: queryCodeBlockCharacters,
  interconnections: queryInterconnections,
  firebaseLinks: queryFireBaseAttachements,
  externalLinks: queryExternalLinks,
};

const STAT_METRIC_KEYS = Object.keys(STAT_QUERIES) as StatMetricKey[];

const STATS_DRAWER_ID = "roamjs-stats-drawer";

const Loader = (): React.ReactElement => (
  <span className="inline-block align-middle">
    <Spinner size={14} />
  </span>
);

type MetricProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentProps<typeof Icon>["icon"];
};

const Metric = ({ label, value, icon }: MetricProps): React.ReactElement => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 opacity-75">
      <Icon icon={icon} size={14} />
      <span className={Classes.TEXT_SMALL}>{label}</span>
    </div>
    <span className="font-semibold tabular-nums">{value}</span>
  </div>
);

type RenderStatValueArgs = {
  statKey: StatMetricKey;
  stats: Stats;
  loading: LoadingState;
  autoLoad: boolean;
  onLoad: ({ statKey }: { statKey: StatMetricKey }) => void;
};

const renderStatValue = ({
  statKey,
  stats,
  loading,
  autoLoad,
  onLoad,
}: RenderStatValueArgs): React.ReactNode => {
  const value = stats[statKey];
  if (value != null) {
    return formatInt(value);
  }

  if (loading[statKey]) {
    return <Loader />;
  }

  if (!autoLoad) {
    return (
      <Button
        small
        minimal
        icon="download"
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          onLoad({ statKey });
        }}
        text="Load"
      />
    );
  }

  return <Loader />;
};

type RenderTagValueArgs = {
  tag: TagName;
  stats: Stats;
  loading: LoadingState;
  autoLoad: boolean;
  onLoad: ({ tag }: { tag: TagName }) => void;
};

const renderTagValue = ({
  tag,
  stats,
  loading,
  autoLoad,
  onLoad,
}: RenderTagValueArgs): React.ReactNode => {
  const count = stats.tagCounts?.[tag];
  if (count != null) {
    return formatInt(count);
  }

  const loadingKey = getLoadingKeyForTag(tag);
  if (loading[loadingKey]) {
    return <Loader />;
  }

  if (!autoLoad) {
    return (
      <Button
        small
        minimal
        icon="download"
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          onLoad({ tag });
        }}
        text="Load"
      />
    );
  }

  return <Loader />;
};

export const StatsDrawer = ({
  onClose,
  isOpen,
  extensionAPI,
}: RoamOverlayProps<{ extensionAPI: ExtensionAPI }>): React.ReactElement => {
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState<LoadingState>({});
  const [autoLoad, setAutoLoad] = useState<boolean>(() =>
    getAutoLoadPreference({ extensionAPI }),
  );
  const loadingRef = useRef<LoadingState>({});

  const setLoadingState = useCallback(
    ({
      loadingKey,
      isLoading,
    }: {
      loadingKey: string;
      isLoading: boolean;
    }): void => {
      loadingRef.current = { ...loadingRef.current, [loadingKey]: isLoading };
      setLoading((prev) => ({ ...prev, [loadingKey]: isLoading }));
    },
    [],
  );

  const loadMetric = useCallback(
    ({ statKey }: { statKey: StatMetricKey }): void => {
      if (loadingRef.current[statKey]) {
        return;
      }

      setLoadingState({ loadingKey: statKey, isLoading: true });
      setTimeout(() => {
        runQuery(STAT_QUERIES[statKey])
          .then((result) => {
            setStats((prev) => ({ ...prev, [statKey]: scalar(result) }));
          })
          .catch(() => {
            setStats((prev) => ({ ...prev, [statKey]: 0 }));
          })
          .finally(() => {
            setLoadingState({ loadingKey: statKey, isLoading: false });
          });
      }, 0);
    },
    [setLoadingState],
  );

  const loadTag = useCallback(
    ({ tag }: { tag: TagName }): void => {
      const loadingKey = getLoadingKeyForTag(tag);
      if (loadingRef.current[loadingKey]) {
        return;
      }

      setLoadingState({ loadingKey, isLoading: true });
      runAfterNextPaint({
        callback: () => {
          runQuery(queryTagRefs(tag))
            .then((result) => {
              setStats((prev) => ({
                ...prev,
                tagCounts: { ...(prev.tagCounts ?? {}), [tag]: scalar(result) },
              }));
            })
            .catch(() => {
              setStats((prev) => ({
                ...prev,
                tagCounts: { ...(prev.tagCounts ?? {}), [tag]: 0 },
              }));
            })
            .finally(() => {
              setLoadingState({ loadingKey, isLoading: false });
            });
        },
      });
    },
    [setLoadingState],
  );

  const loadAllStats = useCallback((): void => {
    STAT_METRIC_KEYS.forEach((statKey) => loadMetric({ statKey }));
    TAGS.forEach((tag) => loadTag({ tag }));
  }, [loadMetric, loadTag]);

  useEffect(() => {
    if (!isOpen) return;

    const nextAutoLoad = getAutoLoadPreference({ extensionAPI });
    setAutoLoad(nextAutoLoad);
    setStats({});
    setLoading({});
    loadingRef.current = {};

    const timer = window.setTimeout(() => {
      if (nextAutoLoad) {
        loadAllStats();
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [extensionAPI, isOpen, loadAllStats]);

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
          {!autoLoad && (
            <Card elevation={0} className="mb-3 p-2.5 bg-black/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`${Classes.TEXT_SMALL} m-0 opacity-70`}>
                  Manual mode is on. Use the extension settings panel to turn
                  auto-load back on.
                </p>
                <Button
                  small
                  icon="download"
                  intent={Intent.PRIMARY}
                  onClick={loadAllStats}
                  text="Load all stats"
                />
              </div>
            </Card>
          )}
          {/* Top overview */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            <Card elevation={1} className="p-3">
              <Metric
                label="Pages"
                value={renderStatValue({
                  statKey: "pages",
                  stats,
                  loading,
                  autoLoad,
                  onLoad: loadMetric,
                })}
                icon="document"
              />
            </Card>
            <Card elevation={1} className="p-3">
              <Metric
                label="Interconnections"
                value={renderStatValue({
                  statKey: "interconnections",
                  stats,
                  loading,
                  autoLoad,
                  onLoad: loadMetric,
                })}
                icon="link"
              />
            </Card>
            <Card elevation={1} className="p-3">
              <Metric
                label="Firebase links"
                value={renderStatValue({
                  statKey: "firebaseLinks",
                  stats,
                  loading,
                  autoLoad,
                  onLoad: loadMetric,
                })}
                icon="cloud"
              />
            </Card>
            <Card elevation={1} className="p-3">
              <Metric
                label="External links"
                value={renderStatValue({
                  statKey: "externalLinks",
                  stats,
                  loading,
                  autoLoad,
                  onLoad: loadMetric,
                })}
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
                        {renderStatValue({
                          statKey: "nonCodeBlocks",
                          stats,
                          loading,
                          autoLoad,
                          onLoad: loadMetric,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Words
                      </td>
                      <td className="text-right tabular-nums">
                        {renderStatValue({
                          statKey: "nonCodeBlockWords",
                          stats,
                          loading,
                          autoLoad,
                          onLoad: loadMetric,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Characters
                      </td>
                      <td className="text-right tabular-nums">
                        {renderStatValue({
                          statKey: "nonCodeBlockChars",
                          stats,
                          loading,
                          autoLoad,
                          onLoad: loadMetric,
                        })}
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
                        {renderStatValue({
                          statKey: "blockquotes",
                          stats,
                          loading,
                          autoLoad,
                          onLoad: loadMetric,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Words
                      </td>
                      <td className="text-right tabular-nums">
                        {renderStatValue({
                          statKey: "blockquotesWords",
                          stats,
                          loading,
                          autoLoad,
                          onLoad: loadMetric,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Characters
                      </td>
                      <td className="text-right tabular-nums">
                        {renderStatValue({
                          statKey: "blockquotesChars",
                          stats,
                          loading,
                          autoLoad,
                          onLoad: loadMetric,
                        })}
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
                        {renderStatValue({
                          statKey: "codeBlocks",
                          stats,
                          loading,
                          autoLoad,
                          onLoad: loadMetric,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className={`${Classes.TEXT_SMALL} opacity-75`}>
                        Characters
                      </td>
                      <td className="text-right tabular-nums">
                        {renderStatValue({
                          statKey: "codeBlockChars",
                          stats,
                          loading,
                          autoLoad,
                          onLoad: loadMetric,
                        })}
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
                    onClick={() => {
                      if (!autoLoad && stats.tagCounts?.[tag] == null) {
                        loadTag({ tag });
                        return;
                      }

                      window.roamAlphaAPI.ui.mainWindow.openPage({
                        page: { title: tag },
                      });
                    }}
                    className="cursor-pointer"
                  >
                    <span className="opacity-90">{tag}</span>{" "}
                    <span className="font-bold">
                      {renderTagValue({
                        tag,
                        stats,
                        loading,
                        autoLoad,
                        onLoad: loadTag,
                      })}
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

export const toggleStatsDrawer = ({
  extensionAPI,
}: {
  extensionAPI: ExtensionAPI;
}): void => {
  if (document.getElementById(STATS_DRAWER_ID)) {
    closeStatsDrawer?.();
    closeStatsDrawer = null;
  } else {
    closeStatsDrawer =
      renderOverlay({
        id: STATS_DRAWER_ID,
        Overlay: StatsDrawer,
        props: { extensionAPI },
      }) ?? null;
  }
};
