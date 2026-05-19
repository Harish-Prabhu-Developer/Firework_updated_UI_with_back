import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Platform, View } from 'react-native';

interface PaginationPortalContextValue {
  setPaginationNode: (node: ReactNode | null) => void;
}

const PaginationPortalContext = createContext<PaginationPortalContextValue>({
  setPaginationNode: () => undefined,
});

export const PaginationPortalProvider = ({ children }: { children: ReactNode }) => {
  const [paginationNode, setPaginationNodeState] = useState<ReactNode | null>(null);

  const setPaginationNode = useCallback((node: ReactNode | null) => {
    setPaginationNodeState(node);
  }, []);

  const value = useMemo(() => ({ setPaginationNode }), [setPaginationNode]);

  return (
    <PaginationPortalContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {paginationNode ? (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              ...(Platform.OS === 'android' ? { elevation: 30 } : {}),
            }}
          >
            {paginationNode}
          </View>
        ) : null}
      </View>
    </PaginationPortalContext.Provider>
  );
};

export const usePaginationPortal = () => useContext(PaginationPortalContext);
