import React, { useEffect, useState, useCallback, CSSProperties, useContext } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ViewComponentProps, TableBodyColumn } from './types'
import { MappingDict, ViewObject } from '@/types'
import { PageStore } from '@/store'
import { fetchPageMapping } from "@/api/page"
import { apiGet } from "@/api/app"
import { replaceTemplate } from "@/lib/util_string"
import { RiEqualizerLine } from '@remixicon/react'
import { renderTableElement } from './view-component'
import { TableSetting } from './table-setting'
import { cn } from '@/lib/utils'
import { toast } from 'sonner';
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { handleOperation } from "@/components/action"
import { useParams } from "react-router-dom";
import { useStore } from 'zustand'
import { Loadding } from "@/components/page-loadding"
import { ButtonGroup } from "@/components/ui/button-group"
import { base64UrlEncode } from "@/lib/util_string"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next';

type PageBarSate = {
    page_count: number
    total: number
}

type PageBarConfig = {
    page_index: number
    page_count: number
    page_size: number
    total: number
    selected_pages: number[]
}

export function TablePageView({ id, vo, dataTables, operations }: ViewComponentProps & React.ComponentProps<"div">) {
    const ctx = useContext(PageModelContext);
    const pageViewCtx = useContext(PageViewContext);
    if (!ctx) throw new Error("must be used within PageModelProvider");
    if (!pageViewCtx) throw new Error("must be used within PageViewProvider");

    const { t } = useTranslation();
    const urlParams = useParams();
    const urlVars: Record<string, string> = {}
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });
    // const [tableData, setData] = useState<RowData[]>([])

    const viewDataStoreId = vo.dataStore || vo.id
    const viewParamStoreId = vo.paramsStore || vo.id + "-params"
    const currentPath = window.location.pathname
    const tableDataSelector = useCallback((state: any) => state.data[vo.id], [vo.id, currentPath]);
    const setDataSelector = useCallback((state: any) => state.setData, [vo.id]);
    const effectsSelector = useCallback((state: any) => state.effects, [vo.id]);
    const viewStateSelector = useCallback((state: any) => state.viewState[vo.id], [vo.id]);

    const storePath = useStore(ctx.store, (state: any) => state.path);
    const tableData = useStore(ctx.store, (state: any) => state.data[viewDataStoreId]);
    const viewParams = useStore(ctx.store, (state: any) => state.data[viewParamStoreId]);
    const setData = useStore(ctx.store, (state: any) => state.setData);
    const effects = useStore(ctx.store, effectsSelector);
    const viewState = useStore(ctx.store, viewStateSelector);

    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState<number>(1)
    const [total, setTotal] = useState<number>(0)
    const [pageSize, setPageSize] = useState<number>(50)
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])
    const [goPage, setGoPage] = useState<number>(1)
    const [mappingDict, setMappingDict] = useState<MappingDict>()

    const tblView = vo
    const apiUrl = tblView.api
    const rowKey = tblView.rowKey || 'id'
    const tableBodyDef: TableBodyColumn[] = tblView.tableBody?.children || []
    const tableFoot = tblView.tableFoot

    const dataTableId = tblView.dataTable
    const dataTable = dataTables[dataTableId]

    const mergedColumns: TableBodyColumn[] = tableBodyDef.map((colDef) => {
        if (colDef.id === '__check' || colDef.id === 'opr') {
            return { ...colDef }
        }
        const fieldDef = dataTable.fields.find((f) => f.id === colDef.id)
        if (!fieldDef) {
            return { ...colDef }
        }
        return {
            ...fieldDef,
            ...colDef,
        }
    })

    async function loadData() {
        setLoading(true)
        try {
            const params = new URLSearchParams(window.location.search)
            params.set('page', String(page))
            params.set('size', String(pageSize))

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
    }, [currentPath, viewParams, effects, page, pageSize])


    function renderTableToolBar() {
        return (
            <div className="flex items-center justify-between mb-1 w-full">
                <div className="flex space-x-2">{tblView.toolBar && tblView.toolBar.left && tblView.toolBar.left.object && ctx.buildViewObject({ id: "left", dataTables, operations, vo: (tblView.toolBar.left as ViewObject), dict: mappingDict, dataTableId })}</div>
                <div className="flex space-x-2">
                    <div className="flex items-center space-x-2 gap-2">
                        {tblView.toolBar && tblView.toolBar.right && tblView.toolBar.right.object && ctx.buildViewObject({ id: "right", dataTables, operations, vo: (tblView.toolBar.right as ViewObject), dict: mappingDict, dataTableId })}
                        {tblView.isSetting && <ButtonGroup>
                            <Popover >
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <RiEqualizerLine className="mr-0 h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className='text-sm' align='end' sideOffset={0}>
                                    <TableSetting dataTable={dataTableId} dataTables={dataTables} mappingDict={mappingDict} />
                                </PopoverContent>
                            </Popover>
                        </ButtonGroup>}
                    </div>
                </div>
            </div>
        )
    }


    function getColStyle(col: TableBodyColumn, head: boolean): CSSProperties {
        const style: CSSProperties = {}
        if (col.fixed === 'left') {
            style.position = 'sticky'
            style.left = 0
            style.zIndex = 10
            style.backgroundColor = head ? 'var(--color-gray-100)' : '#fff'
        } else if (col.fixed === 'right') {
            style.position = 'sticky'
            style.right = 0
            style.zIndex = 10
            style.backgroundColor = head ? 'var(--color-gray-100)' : '#fff'
        }
        return style
    }

    function renderTableHeader() {
        return (
            <TableRow className="h-10 bg-gray-100">
                {mergedColumns.map((col) => {
                    const style = getColStyle(col, true)
                    if (col.id === '__check') {
                        return (
                            <TableHead
                                key="__check"
                                style={style}
                                className="pt-1 pb-1 h-10 whitespace-nowrap overflow-hidden text-ellipsis"
                            >
                                <Checkbox
                                    checked={tableData && selectedKeys.length === tableData.length && tableData.length > 0}
                                    onCheckedChange={checked => {
                                        if (checked) {
                                            setSelectedKeys(tableData.map(item => String(item[rowKey])))
                                        } else {
                                            setSelectedKeys([])
                                        }
                                    }}
                                />
                            </TableHead>
                        )
                    }
                    return (
                        <TableHead
                            key={col.id}
                            style={style}
                            className="pt-1 pb-1 h-10 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                            {col.label}
                        </TableHead>
                    )
                })}
            </TableRow>
        )
    }

    function toggleSelectRow(rowId: string) {
        setSelectedKeys(prev => {
            if (prev.includes(rowId)) {
                return prev.filter(id => id !== rowId)
            }
            return [...prev, rowId]
        })
    }

    function renderTableBody() {
        if (loading) {
            return (
                <TableRow className="h-12">
                    <TableCell colSpan={mergedColumns.length} className="text-center">
                        <Loadding />
                    </TableCell>
                </TableRow>
            )
        }
        if ((!tableData || !tableData.length) && !loading) {
            return (
                <TableRow className="h-12">
                    <TableCell colSpan={mergedColumns.length} className="text-center">
                        {t('components.tablePageView.noData')}
                    </TableCell>
                </TableRow>
            )
        }
        return tableData.map((row) => {
            const rowId = String(row[rowKey] ?? '')
            return (
                <TableRow key={rowId} className="cursor-default h-10">
                    {mergedColumns.map((col) => {
                        const style = getColStyle(col, false)
                        if (col.id === '__check') {
                            return (
                                <TableCell
                                    key="__check"
                                    style={style}
                                    className="pt-1 pb-1 h-10 whitespace-nowrap overflow-hidden text-ellipsis"
                                >
                                    <Checkbox checked={selectedKeys.includes(rowId)} onCheckedChange={() => toggleSelectRow(rowId)} />
                                </TableCell>
                            )
                        }
                        if (col.id === 'opr') {
                            const comps = col.components?.split(',')
                            return (
                                <TableCell
                                    key={"oper:" + rowId}
                                    style={style}
                                    className="pt-1 pb-1 space-x-2 whitespace-nowrap overflow-hidden text-ellipsis"
                                >
                                    {comps?.map((c: string) => {
                                        const oper = operations[c]
                                        if (!oper) return null
                                        return (
                                            <Button
                                                key={"oper:" + rowId + ":" + c}
                                                variant={oper.level === 'danger' ? 'destructive' : 'secondary'}
                                                size="sm"
                                                onClick={async () => {
                                                    await handleOperation({ oper, ctx, record: row, urlVars })
                                                }}
                                                className="h-6 rounded-sm"
                                            >
                                                {oper.label}
                                            </Button>
                                        )
                                    })}
                                </TableCell>
                            )
                        }
                        const fieldVal = row[col.id]
                        return (
                            <TableCell
                                key={col.id}
                                style={style}
                                className="pt-1 pb-1 h-10 whitespace-nowrap overflow-hidden text-ellipsis"
                            >
                                {renderTableElement(fieldVal, col, dataTables, mappingDict)}
                            </TableCell>
                        )
                    })}
                </TableRow>
            )
        })
    }

    function prevPage() {
        setPage(p => (p > 1 ? p - 1 : 1))
        setGoPage(page > 1 ? page - 1 : 1)
    }

    function nextPage() {
        const totalPages = Math.ceil(total / pageSize)
        setPage(p => (p < totalPages ? p + 1 : totalPages))
        setGoPage(page < totalPages ? page + 1 : totalPages)
    }

    function handleGoPage() {
        let val = goPage || 1
        const totalPages = Math.ceil(total / pageSize)
        if (val < 1) val = 1
        if (val > totalPages) val = totalPages
        setPage(val)
        setGoPage(val)
    }

    function renderPagination() {
        if (!tableFoot?.show) return null
        const totalPages = Math.ceil(total / pageSize) || 1
        const currCount = tableData ? tableData.length : 0
        const switchPageArr = (String(tableFoot.switchPage) || '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean)

        return (
            <div className="mt-1 flex items-center justify-between border-t p-1">
                <div className=" text-gray-600">
                    {t('components.tablePageView.pagination.pageInfo', {
                        current: page,
                        total: totalPages,
                        currentCount: currCount,
                        totalCount: total
                    })}
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                    <span>{t('components.tablePageView.pagination.perPage')}</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(val) => {
                            setPageSize(Number(val))
                            setPage(1)
                            setGoPage(1)
                        }}
                    >
                        <SelectTrigger className="w-[72px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {switchPageArr.map((item: string) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={prevPage} disabled={page <= 1}>
                        ‹
                    </Button>
                    <div className="w-6 text-center">{page}</div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={nextPage}
                        disabled={page >= totalPages}
                    >
                        ›
                    </Button>
                    <span>{t('components.tablePageView.pagination.goTo')}</span>
                    <Input
                        className="w-14 h-8"
                        value={goPage}
                        onChange={(e) => setGoPage(parseInt(e.target.value))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleGoPage()
                        }}
                    />
                    <span>{t('components.tablePageView.pagination.page')}</span>
                </div>
            </div>
        )
    }

    return (

        <div className="p-1 pb-0 flex flex-col w-full h-full bg-whit text-xs font-normal text-gray-700 overflow-hidden">
            <div className="flex">
                {renderTableToolBar()}
            </div>
            <div className="flex-1 rounded border flex flex-col overflow-hidden">
                <div className="flex flex-col flex-1 h-full overflow-x-auto relative">
                    <Table className="w-full m-0 text-xs">
                        <colgroup>
                            {mergedColumns.map((col) => {
                                if (col.id === '__check') {
                                    return (<col key={col.id} className="w-[45px] min-w-[45px]" />)
                                } else if (col.id === 'opr') {
                                    return (<col key={col.id} className="w-[150px] min-w-[150px]" />)
                                } else {
                                    return (<col key={col.id} className={cn(col.width && `w-[${col.width}] min-w-[${col.width}]`)} />)
                                }
                            })}
                        </colgroup>
                        <TableHeader className="sticky top-0 bg-gray-50 z-11">
                            {renderTableHeader()}
                        </TableHeader>
                        <TableBody>
                            {renderTableBody()}
                        </TableBody>
                    </Table>
                </div>
                <div className="h-12 bg-white z-10">
                    {renderPagination()}
                </div>
            </div>
        </div>
    )
}