import runExtension from "roamjs-components/util/runExtension";
import { toggleStatsDrawer } from "./components/StatsDrawer";

const COMMAND_LABEL = "Stats: Toggle Stats Drawer";
export default runExtension(async ({ extensionAPI }) => {
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
