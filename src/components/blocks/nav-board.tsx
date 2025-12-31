import React, { useEffect, useState, useCallback, CSSProperties, useContext } from 'react'
import { cn } from '@/lib/utils';
import { ViewComponentProps } from './types'
import { MappingDict, ViewObject } from '@/types'
import CardBoard from '@/components/ui/card-board';
import { PageStore } from '@/store'
import { fetchPageMapping } from "@/api/page"
import { apiGet } from "@/api/app"
import { replaceTemplate } from "@/lib/util_string"
import { base64UrlEncode } from "@/lib/util_string"
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { handleOperation } from "@/components/action"
import { useParams } from "react-router-dom";
import { useStore } from 'zustand'
import { Loadding } from "@/components/page-loadding"
import { IconFolderCode } from "@tabler/icons-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, } from "@/components/ui/empty"
import { useTranslation } from 'react-i18next'

export function NavCardBoardView({ id, vo, dataTables, operations }: ViewComponentProps & React.ComponentProps<"div">) {
  const { t } = useTranslation()
  const ctx = useContext(PageModelContext);
  const pageViewCtx = useContext(PageViewContext);
  if (!ctx) throw new Error("must be used within PageModelProvider");
  if (!pageViewCtx) throw new Error("must be used within PageViewProvider");

  const urlParams = useParams();
  const urlVars: Record<string, string> = {}
  Object.entries(urlParams).forEach(([key, value]) => {
    if (value && key !== '*') urlVars[key] = value
  });

  const viewDataStoreId = vo.dataStore || vo.id
  const viewParamStoreId = vo.paramsStore || vo.id + "-params"
  const currentPath = window.location.pathname
  const setDataSelector = useCallback((state: any) => state.setData, [vo.id]);
  const effectsSelector = useCallback((state: any) => state.effects, [vo.id]);
  const viewStateSelector = useCallback((state: any) => state.viewState[vo.id], [vo.id]);

  const storePath = useStore(ctx.store, (state: any) => state.path);
  const viewData = useStore(ctx.store, (state: any) => state.data[viewDataStoreId]);
  const viewParams = useStore(ctx.store, (state: any) => state.data[viewParamStoreId]);
  const setData = useStore(ctx.store, (state: any) => state.setData);
  const effects = useStore(ctx.store, effectsSelector);
  const viewState = useStore(ctx.store, viewStateSelector);

  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState<number>(0)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [mappingDict, setMappingDict] = useState<MappingDict>()

  const tblView = vo
  const apiUrl = tblView.api
  const rowKey = tblView.rowKey || 'id'
  const itemCfg = vo.itemConfig

  const dataTableId = tblView.dataTable
  const dataTable = dataTables[dataTableId]


  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams(window.location.search)
      params.set('page', String(1))
      params.set('size', String(1000))

      console.log("viewParams:", viewParams)
      if (viewParams) {
        Object.keys(viewParams).forEach((k) => {
          const val = viewParams[k]
          if (!val) {
            return
          }

          if (k === 'filter') {
            //base64
            params.set(k, base64UrlEncode(JSON.stringify(val)))
          } else {
            if (Array.isArray(val)) {
              val.length > 0 && params.set(k, val.map(v => v.value).join(','))
            } if (typeof val === 'object') {
              val.value && params.set(k, val.value)
            } else {
              val.length > 0 && params.set(k, val)
            }
          }
        })
      }

      const getUrl = replaceTemplate(apiUrl, urlVars)
      const result = await apiGet(getUrl, params)
      const content = result.content ?? []
      const totalElements = result.totalElements ?? 0
      if (dataTable.mappingApi) {
        const dictUrl = replaceTemplate(dataTable.mappingApi, urlVars)
        const mappingData = await fetchPageMapping(id, dictUrl, params, urlVars)

        setMappingDict(mappingData || {})
      }

      setData(viewDataStoreId, content)
      setTotal(totalElements)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    if (apiUrl) {
      void loadData()
    }
  }, [currentPath, viewParams, effects])



  if (loading) {
    return (
      <Loadding />
    )
  }
  if ((!viewData || !viewData.length) && !loading) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconFolderCode />
          </EmptyMedia>
          <EmptyTitle>{t('components.navBoard.noData')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  let groups = []
  const groupField = dataTable.fields.find((f) => f.id === itemCfg.group)
  let dictItems = mappingDict && groupField && mappingDict[groupField.source];
  dictItems && dictItems.options.map(item => {
    groups.push({
      id: item.value,
      title: item.label,
      count: 0,
    })
  })

  let items = []
  viewData && viewData.map(item => {
    let labels = []
    itemCfg.labels && itemCfg.labels.split(",").map(fieldId => {
      const fieldDef = dataTable.fields.find((f) => f.id === fieldId)
      const dictItem = mappingDict && fieldDef && fieldDef.source && mappingDict[fieldDef.source]
      const l = dictItem && dictItem.items[item[fieldId]]?.label || item[fieldId]
      labels.push(l)
    })

    const iconField = itemCfg.icon && dataTable.fields.find((f) => f.id === itemCfg.icon)
    const dictItem = mappingDict && iconField && iconField.source && mappingDict[iconField.source]
    const itemIcon = dictItem && dictItem.items[item[itemCfg.icon]]?.label || item[itemCfg.icon] || null

    itemCfg.id && items.push({
      id: item[itemCfg.id],
      title: item[itemCfg.title],
      group: item[itemCfg.group],
      icon: itemIcon,
      labels: labels,
      actions: [{ text: t('components.navBoard.viewDetails'), action: { type: 'view' } }],
    })
   
    groups.map(group => {
      if (group.id === item[itemCfg.group]) {
        group.count++
      }
    })
  })

  groups.sort((a, b) => b.count - a.count)
  return (
    <div className="w-full h-screen">

      <CardBoard
        layoutType="label"
        groups={groups}
        items={items}
        showTagAll
        hideGroupIcon
        cardMinWidth={320}
        cardMaxWidth={400}
        cardGap={16}
        onSelect={(item) => console.log('Selected:', item)}
        actionEvent={(action) => console.log('Action:', action)}
      />
    </div>
  );
};