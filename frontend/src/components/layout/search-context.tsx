import { createContext, useContext } from "react";

type SearchContextType = {
  openSearch: () => void;
};

export const SearchContext = createContext<SearchContextType>({
  openSearch: () => {},
});

export function useSearch() {
  return useContext(SearchContext);
}
