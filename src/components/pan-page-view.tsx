import React, { useCallback, useMemo, useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loadding } from "@/components/page-loadding"
import { buildViewObject } from "@/components/page-builder"
import { fetchPageConfig } from "@/api/page"
import { MenuItem, PageModel } from "@/types"
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { createPageStore, PageStore } from "@/store"
import { AlertCircle } from "lucide-react"
import { createStore, useStore } from 'zustand'
import { replaceTemplate } from "@/lib/util_string"

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

interface PageviewProps {
    id: string
    key?: string
    path: string
    menu: MenuItem
}


type PageStoreType = ReturnType<typeof createPageStore>
const pageStoreMap = new Map<string, PageStoreType>()
const MAX_STORE_SIZE = 10

const cleanupOldStores = (currentPath: string) => {
    if (pageStoreMap.size > MAX_STORE_SIZE) {
        const entries = Array.from(pageStoreMap.entries())
        const toDelete = entries
            .filter(([path]) => path !== currentPath)
            .slice(0, pageStoreMap.size - MAX_STORE_SIZE + 1)

        toDelete.forEach(([path, store]) => {
            // 清理 store 数据
            const state = store.getState()
            if (state.setState) {
                state.setState({
                    data: {},
                    effects: {},
                    viewState: {},
                    path: currentPath
                })
            }
            pageStoreMap.delete(path)
        })
    }
}

export function PanPageview(props: PageviewProps) {
    const { id, path, menu } = props
    const { t } = useTranslation()
    const [config, setConfig] = useState<PageModel>()
    const [loading, setLoading] = React.useState(true)
    const [dataLoading, setDataLoading] = React.useState(true)
    const [error, setError] = React.useState<string>('')
    const [visibleViews, setVisibleViews] = useState<string[]>([])
    const [record, setRecord] = useState<Record<string, any>>({})
    const pageViewRef = useRef(null);

    if (!pageStoreMap.has(path)) {
        const newStore = createPageStore()
        pageStoreMap.set(path, newStore)
        cleanupOldStores(path)
    }

    const pageStore = pageStoreMap.get(path)!

    // 使用 store 的方法
    const setPageDatas = useStore(pageStore, (state) => state.setDatas)
    const setEffects = useStore(pageStore, (state) => state.setEffects)
    const fetchData = useStore(pageStore, (state) => state.fetchData)

    const urlParams = useParams();
    const urlVars: Record<string, string> = {}
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });

    if (menu.url == undefined || menu.url == "") {
        return <div className="p-4 text-red-500">{error || t('app.pageLoadFailed')}</div>
    }

    async function loadConfigData() {
        try {
            const params = new URLSearchParams(window.location.search)
            const pageConfig = await fetchPageConfig(id, menu.url || '', params)
            const { pageView, mainView } = pageConfig || {}
            if (pageView && mainView && pageView[mainView]) {
                setVisibleViews([mainView])
            }
            const keys = Object.keys(pageView);
            setEffects(keys)
            setConfig(pageConfig)
        } catch (error) {
            setError(t('app.configLoadFailed'))
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        void loadConfigData()
    }, [path])

    useEffect(() => {
        if (config?.dataStore) {
            let pageState = {}
            for (const data of Object.values(config?.dataStore || {})) {
                data.type == 'list' ? (pageState[data.id] = []) : (pageState[data.id] = {})
            }
            setPageDatas(pageState)
        }
        const loadData = async () => {
            setDataLoading(true)
            try {
                for (const data of Object.values(config?.dataStore || {})) {
                    data.api && await fetchData(data.id, replaceTemplate(data.api, urlVars))
                }
            } catch (error) {
                setError(t('app.configLoadFailed'))
                console.error(error)
            } finally {
                setDataLoading(false)
            }
        }

        loadData()

    }, [id, config])

    if (loading) {
        return (<Loadding />)
    }

    if (error || !config) {
        return (
            <div className="flex h-full flex-1 p-4 items-center justify-center">
                <Alert variant="destructive" className="w-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('common.error')}</AlertTitle>
                    <AlertDescription> {error || t('app.pageLoadFailed')} </AlertDescription>
                </Alert>
            </div>)
    }

    const { pageView, dataSet, operations } = config || {}

    // 触发显示其他 view
    const showView = (viewName: string, data?: Record<string, any>) => {
        console.log('showView', viewName, data)
        data && setRecord(data)
        if (!visibleViews.includes(viewName)) {
            setVisibleViews((prev) => [...prev, viewName])
        }
    }

    const closeView = (viewName: string) => {
        console.log('closeView', viewName)
        setVisibleViews((prev) => prev.filter((v) => v !== viewName))
    }

    const effects = (views: string[]) => {
        console.log('effects', views)
        setEffects(views)
    }

    return (
        <PageModelContext.Provider value={{ pageModel: config, store: pageStore, record, buildViewObject, showView, closeView, effects, container: pageViewRef.current }}>
            <div className="h-full w-full flex flex-col overflow-hidden relative" ref={pageViewRef}>
                {dataLoading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <Loadding />
                    </div>
                )}
                {visibleViews.map((vn) => {
                    const viewConfig = pageView[vn]
                    if (!viewConfig) return null
                    if (typeof viewConfig !== "object") return null
                    let prop = { id: vn, vo: viewConfig, dataTables: dataSet, operations, key: vn }
                    return (
                        <PageViewContext.Provider value={{ id: vn, viewConfig, }} key={"pbc:" + vn + ":"}>
                            {buildViewObject(prop)}
                        </PageViewContext.Provider>
                    )
                })}
            </div>
        </PageModelContext.Provider>
    )
}