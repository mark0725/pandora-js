import { createStore, create } from 'zustand'
import { apiGet } from "@/api/app"

// export const useThemeStore = create((set) => ({
//     theme: 'light',
//     setTheme: (theme) => set({ theme })
// }));

//React Context
export interface PageStore {
    data: Record<string, any>;
    effects: Record<string, string>;
    setData: (ds: string, data: any) => void;
    setEffects: (views: string[]) => void;
    fetchData: (viewId: string, url: string, params?: URLSearchParams) => Promise<void>;
}

export const makePageDataStore = () =>
    createStore<PageStore>((set) => ({
        data: {},
        effects: {},
        setData: (ds: string, v: any) => {
            set((state: any) => ({
                data: {
                    ...state.data,
                    [ds]: v
                }
            }))
        },
        setEffects: (views: string[]) => {
            const timestamp = Date.now();
            set((state: any) => ({
                effects: {
                    ...state.effects,
                    ...views.reduce((acc, v) => {
                        acc[v] = timestamp;
                        return acc;
                    }, {} as Record<string, number>),
                }
            }))
        },
        fetchData: async (dataId: string, url: string, params?: URLSearchParams) => {
            const data = await apiGet(url, params);
            set((state: any) => ({
                data: {
                    ...state.data,
                    [dataId]: data
                }
            }));
        }
    }))


export const usePageDataStore = create<PageStore>((set) => ({
    data: {},
    effects: {},
    setData: (ds: string, v: any) => {
        set((state: any) => ({
            data: {
                ...state.data,
                [ds]: v
            }
        }))
    },
    setEffects: (views: string[]) => {
        const timestamp = Date.now();
        set((state: any) => ({
            effects: {
                ...state.effects,
                ...views.reduce((acc, v) => {
                    acc[v] = timestamp;
                    return acc;
                }, {} as Record<string, number>),
            }
        }))
    },
    fetchData: async (viewId: string, url: string, params?: URLSearchParams) => {
        const data = await apiGet(url, params);
        set((state: any) => ({
            data: {
                ...state.data,
                [viewId]: data
            }
        }));
    }
}))