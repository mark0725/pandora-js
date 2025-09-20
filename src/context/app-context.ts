import React from 'react';

export interface AppState {
    appConfigLoaded?: boolean
    appConfigError?: string | null
    appConfigLoading?: boolean
    appPageLoading?: boolean
}

export interface AppContextType {
    mainContainer?: HTMLElement | null | undefined
    setAppSate: (state: AppState) => void
}

export const AppContext = React.createContext<AppContextType | null>(null);