import React from 'react';
import { PageModel, ViewObject } from "@/types"
import { ViewComponentProps } from "@/components/blocks/types"
import { PageStore } from "@/store"
import { StoreApi } from 'zustand'

export interface PageModelContextType {
    pageModel: PageModel
    record?: Record<string, any>
    container?: HTMLElement | null | undefined 
    store: StoreApi<PageStore>
    buildViewObject:(props: ViewComponentProps&React.ComponentProps<"div">) => React.ReactNode
    showView: (viewName: string, data?:Record<string,any>) => void
    closeView: (viewName: string) => void
    effects: (views: string[]) => void
    
}

export interface PageViewContextType {
    id: string
    viewConfig: ViewObject
}

export const PageModelContext = React.createContext<PageModelContextType | null>(null);
export const PageViewContext = React.createContext<PageViewContextType | null>(null);

