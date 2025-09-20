
import React, { useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom";
import { Loadding } from "@/components/page-loadding"
import { buildViewObject } from "@/components/page-builder"
import { fetchPageConfig } from "@/api/page"
import { MenuItem, PageModel } from "@/types"
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { makePageDataStore, usePageDataStore } from "@/store"
import { AlertCircle } from "lucide-react"
import { useStore } from 'zustand'
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

// export function PanPageview(props: PageviewProps) {
export function PanPageview(props: PageviewProps) { 
    const { id, path, menu } = props
    const [config, setConfig] = useState<PageModel>()
    const [loading, setLoading] = React.useState(true)
    const [dataLoading, setDataLoading] = React.useState(true)
    const [error, setError] = React.useState<string>('')
    const [visibleViews, setVisibleViews] = useState<string[]>([])
    const [record, setRecord] = useState<Record<string, any>>({})
    const pageViewRef = useRef(null);
    // const [store] = useState(() => new PageDataStore()) 
    const pageStore = React.useMemo(makePageDataStore, [])
    const setEffects = useStore(pageStore, (state) => state.setEffects)
    const fetchData = useStore(pageStore, (state) => state.fetchData)
    // const setEffects = useStore((state) => state.setEffects)
    const urlParams = useParams();
    const urlVars: Record<string, string> = {}
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });

    if (menu.url==undefined||menu.url=="") {
        return <div className="p-4 text-red-500">{error || '页面加载失败'}</div>
    }

    async function loadConfigData() {
        setLoading(true)
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
            setError('加载配置信息失败')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadConfigData()
    }, [id])

    useEffect(() => {
        const loadData = async () => {
            setDataLoading(true)
            try {
                for (const data of Object.values(config?.dataStore || {})) {
                    data.api && fetchData(data.id, replaceTemplate(data.api, urlVars))
                }
            } catch (error) {
                setError('加载配置信息失败')
                console.error(error)
            } finally {
                setDataLoading(false)
            }
        }
        if (config?.dataStore) {
            loadData()
        }
        
    }, [id, config])

    if (loading) {
        return (<Loadding />)
    }

    if (error || !config) {
        return (
        <div className="flex h-full flex-1 p-4 items-center justify-center">
            <Alert variant="destructive" className="w-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>错误提示</AlertTitle>
                <AlertDescription> {error || '页面加载失败'} </AlertDescription>
            </Alert>
        </div>)
    }

    const { pageView, dataSet, operations} = config || {}

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
        <PageModelContext.Provider value={{ pageModel: config, store:pageStore, record, buildViewObject, showView, closeView, effects, container: pageViewRef.current }}>
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
                        return (
                            <PageViewContext.Provider value={{ id: vn, viewConfig, }} key={"pbc:" + vn + ":" + id}>
                                <React.Fragment key={"pb:"+vn+":"+id}>
                                    {buildViewObject({ id: vn, vo: viewConfig, dataTables: dataSet, operations, key:vn})}
                                </React.Fragment>
                            </PageViewContext.Provider>
                        )
                    })}
                </div>
        </PageModelContext.Provider>
    )
}