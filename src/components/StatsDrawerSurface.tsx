import React, { useEffect, useRef } from "react";
import { Button, Drawer, Icon } from "@blueprintjs/core";

type StatsDrawerSurfaceProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const StatsDrawerSurface = ({
  isOpen,
  onClose,
  children,
}: StatsDrawerSurfaceProps): React.ReactElement => {
  const panel = useRef<HTMLElement>(null);
  const previousFocus = useRef(document.activeElement);

  useEffect(() => {
    if (!isOpen) return;
    const previous = previousFocus.current;
    if (previous !== document.body && !previous?.closest(".rm-command-palette"))
      return;

    // Roam removes the palette after invoking the command.
    const frame = window.requestAnimationFrame(() => {
      if (document.activeElement === document.body) {
        panel.current?.querySelector("button")?.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const close = (): void => {
    const restoreFocus = panel.current?.contains(document.activeElement);
    onClose();
    if (!restoreFocus) return;

    const previous = previousFocus.current;
    if (previous instanceof HTMLElement && previous.isConnected) {
      previous.focus({ preventScroll: true });
      if (document.activeElement === previous && previous !== document.body)
        return;
    }
    document
      .querySelector<HTMLElement>(".rm-topbar .bp3-icon-more")
      ?.focus({ preventScroll: true });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={close}
      position="right"
      hasBackdrop={false}
      canOutsideClickClose={false}
      enforceFocus={false}
      autoFocus={false}
      portalClassName="pointer-events-none"
      className="roamjs-stats-drawer pointer-events-auto"
    >
      <section
        ref={panel}
        aria-labelledby="roamjs-stats-heading"
        className="roamjs-stats-panel grid"
      >
        <header className="roamjs-stats-header flex items-center justify-between gap-2">
          <h2 id="roamjs-stats-heading" className="flex items-center gap-2">
            <Icon icon="database" />
            Stats
          </h2>
          <Button
            icon="cross"
            minimal
            aria-label="Close Stats"
            onClick={close}
          />
        </header>
        <div
          role="region"
          aria-label="Graph statistics"
          tabIndex={0}
          className="roamjs-stats-body overflow-y-auto"
        >
          {children}
        </div>
      </section>
    </Drawer>
  );
};
