import React from 'react';

interface AppState {
  loadding: boolean;
}

export const AppStateContext = React.createContext<AppState>({
  loadding: true
});