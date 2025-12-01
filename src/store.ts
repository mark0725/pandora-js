import { createStore, create } from 'zustand'
import { apiGet } from "@/api/app"
import { AppConfig } from "@/types"

// export const useThemeStore = create((set) => ({
//     theme: 'light',
//     setTheme: (theme) => set({ theme })
// }));

export interface AppStore {
    app: AppConfig;
    setApp: (app: AppConfig) => void;
}

export interface AuthStore {
    authed: boolean;
    setAuthed: (s: boolean) => void;
}
export const useAuthStore = create<AuthStore>((set) => ({
    authed: false,
    setAuthed: (s) => set({ authed:s })
}));

export interface PageStore {
    data: Record<string, any>;
    viewState: Record<string, any>;
    effects: Record<string, number>;
    path: string;
    setState: (state: Partial<PageStore>) => void;
    setViewState: (view: string, state: any) => void;
    setData: (ds: string, data: any, method: string) => void;
    setDatas: (data: Record<string, any>) => void;
    setEffects: (views: string[]) => void;
    fetchData: (viewId: string, url: string, params?: URLSearchParams) => Promise<void>;
}

export const createPageStore = () => createStore<PageStore>((set, get) => ({
    data: {},
    effects: {},
    viewState: {},
    path: "",

    setState: (state: Partial<PageStore>) => {
        set(() => state)
    },

    setData: (ds: string, v: any, method: string = "replace") => {
        if (method === "replace") {
            set((state) => ({
                data: {
                    ...state.data,
                    [ds]: v
                }
            }))
            return
        }

        set((state) => ({
            data: {
                ...state.data,
                [ds]: {
                    ...state.data[ds]||{},
                    ...v
                }
            }
        }))
    },

    setDatas: (data: Record<string, any>) => {
        set((state) => ({
            data: {
                ...state.data,
                ...data
            }
        }))
    },

    setViewState: (viewId: string, v: any) => {
        set((state) => ({
            viewState: {
                ...state.viewState,
                [viewId]: v
            }
        }))
    },

    setEffects: (views: string[]) => {
        const timestamp = Date.now();
        set((state) => ({
            effects: {
                ...state.effects,
                ...views.reduce((acc, v) => {
                    acc[v] = timestamp;
                    return acc;
                }, {} as Record<string, number>),
            }
        }))
    },

    fetchData: async (ds: string, url: string, params?: URLSearchParams) => {
        try {
            const data = await apiGet(url, params);
            set((state) => ({
                data: {
                    ...state.data,
                    [ds]: data
                }
            }));
        } catch (error) {
            console.error(`Failed to fetch data for ${ds}:`, error);
        }
    }
}))