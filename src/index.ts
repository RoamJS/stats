import runExtension from "roamjs-components/util/runExtension";
import { toggleStatsDrawer } from "./components/StatsDrawer";
import { render as renderToast } from "roamjs-components/components/Toast";

const COMMAND_LABEL = "Stats: Toggle Stats Drawer";
export default runExtension(async ({ extensionAPI }) => {
  if (process.env.NODE_ENV === "development") {
    renderToast({
      id: "stats-loaded",
      content: "Stats extension loaded",
      intent: "success",
      timeout: 500,
    });
  }

  await extensionAPI.ui.commandPalette.addCommand({
    label: COMMAND_LABEL,
    callback: toggleStatsDrawer,
  });

  return {
    unload: () => {
      extensionAPI.ui.commandPalette.removeCommand({ label: COMMAND_LABEL });
    },
  };
});
