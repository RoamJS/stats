import runExtension from "roamjs-components/util/runExtension";
import type { ExtensionAPI } from "~/types/stats";
import { AUTO_LOAD_STATS_SETTING } from "~/utils/stats";
import { toggleStatsDrawer } from "./components/StatsDrawer";
import { render as renderToast } from "roamjs-components/components/Toast";

const COMMAND_LABEL = "Stats: Toggle Stats Drawer";
const SETTINGS_TAB_TITLE = "Stats";

const getAutoLoadSettingValue = ({
  extensionAPI,
}: {
  extensionAPI: ExtensionAPI;
}): unknown => extensionAPI.settings.get(AUTO_LOAD_STATS_SETTING);

export default runExtension(async ({ extensionAPI }) => {
  if (process.env.NODE_ENV === "development") {
    renderToast({
      id: "stats-loaded",
      content: "Stats extension loaded",
      intent: "success",
      timeout: 500,
    });
  }

  extensionAPI.settings.panel.create({
    tabTitle: SETTINGS_TAB_TITLE,
    settings: [
      {
        id: AUTO_LOAD_STATS_SETTING,
        name: "Auto-load stats",
        description: "Automatically fetch all stats when opening the drawer.",
        action: { type: "switch" },
      },
    ],
  });

  if (typeof getAutoLoadSettingValue({ extensionAPI }) !== "boolean") {
    await extensionAPI.settings.set(AUTO_LOAD_STATS_SETTING, true);
  }

  await extensionAPI.ui.commandPalette.addCommand({
    label: COMMAND_LABEL,
    callback: () => toggleStatsDrawer({ extensionAPI }),
  });

  return {
    unload: () => {
      extensionAPI.ui.commandPalette.removeCommand({ label: COMMAND_LABEL });
    },
  };
});
