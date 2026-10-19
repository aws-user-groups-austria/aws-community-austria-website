import { useEffect } from "react";

/** Sets the tab title while a page is shown (the prerendered HTML already has it for the first load). */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
