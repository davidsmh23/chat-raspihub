import { createContext, useContext, useState } from "react";

import type { LibraryItem } from "@/types/api";

interface MediaHighlightContextValue {
  highlighted: string | null;
  highlight: (title: string | null) => void;
  libraryTitles: string[];
  setLibraryTitles: (titles: string[]) => void;
  libraryItems: LibraryItem[];
  setLibraryItems: (items: LibraryItem[]) => void;
}

const MediaHighlightContext = createContext<MediaHighlightContextValue>({
  highlighted: null,
  highlight: () => {},
  libraryTitles: [],
  setLibraryTitles: () => {},
  libraryItems: [],
  setLibraryItems: () => {},
});

export function MediaHighlightProvider({ children }: { children: React.ReactNode }) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [libraryTitles, setLibraryTitles] = useState<string[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

  return (
    <MediaHighlightContext.Provider
      value={{
        highlighted,
        highlight: setHighlighted,
        libraryTitles,
        setLibraryTitles,
        libraryItems,
        setLibraryItems,
      }}
    >
      {children}
    </MediaHighlightContext.Provider>
  );
}

export function useMediaHighlight() {
  return useContext(MediaHighlightContext);
}
