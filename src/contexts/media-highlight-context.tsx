import { createContext, useContext, useState } from "react";

interface MediaHighlightContextValue {
  highlighted: string | null;
  highlight: (title: string | null) => void;
  libraryTitles: string[];
  setLibraryTitles: (titles: string[]) => void;
}

const MediaHighlightContext = createContext<MediaHighlightContextValue>({
  highlighted: null,
  highlight: () => {},
  libraryTitles: [],
  setLibraryTitles: () => {},
});

export function MediaHighlightProvider({ children }: { children: React.ReactNode }) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [libraryTitles, setLibraryTitles] = useState<string[]>([]);

  return (
    <MediaHighlightContext.Provider
      value={{ highlighted, highlight: setHighlighted, libraryTitles, setLibraryTitles }}
    >
      {children}
    </MediaHighlightContext.Provider>
  );
}

export function useMediaHighlight() {
  return useContext(MediaHighlightContext);
}
