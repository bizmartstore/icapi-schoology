import { useEffect } from "react";

/** Blocks copy/cut outside inputs so users cannot hold-select app text. */
const DisableTextCopy = () => {
  useEffect(() => {
    const allowTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      return Boolean(el.closest("input, textarea, [contenteditable='true'], .allow-select"));
    };

    const onCopy = (e: ClipboardEvent) => {
      if (!allowTarget(e.target)) e.preventDefault();
    };
    const onContextMenu = (e: Event) => {
      if (!allowTarget(e.target)) e.preventDefault();
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  return null;
};

export default DisableTextCopy;
