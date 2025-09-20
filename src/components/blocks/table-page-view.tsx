import React, { useEffect, useState, CSSProperties, useContext } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ViewComponentProps, RowData, TableBodyColumn } from './types'
import { MappingDict, Operation } from '@/types'
import { fetchPageMapping } from "@/api/page"
import { apiGet} from "@/api/app"
import { replaceTemplate } from "@/lib/util_string"
import { RiAddLine, RiEqualizerLine } from '@remixicon/react'
import { renderTableElement } from './view-component'
import { TableFilterBar } from './table-filter-bar'
import { TableSetting } from './table-setting'
import { cn } from '@/lib/utils'
import { toast } from 'sonner';
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { handleOperation } from "@/components/action"
import { useParams } from "react-router-dom";
import { useStore } from 'zustand'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export function TablePageView({ id, vo, dataTables, operations }: ViewComponentProps&React.ComponentProps<"div">) {
    const ctx = useContext(PageModelContext);
    const pageViewCtx = useContext(PageViewContext);
    if (!ctx) throw new Error("must be used within PageModelProvider");
    if (!pageViewCtx) throw new Error("must be used within PageViewProvider");

    const urlParams = useParams();
    const urlVars: Record<string, string> = {}
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });
    const [tableData, setTableData] = useState<RowData[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState<number>(1)
    const [total, setTotal] = useState<number>(0)
    const [pageSize, setPageSize] = useState<number>(50)
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])
    const [goPage, setGoPage] = useState<string>('1')
    const [mappingDict, setMappingDict] = useState<MappingDict>()
    // 增加外部筛选状态
    const [extFilters, setExtFilters] = useState<{ filters: string[]; filterValues: Record<string, any> }>({
        filters: [],
        filterValues: {}
    })

    const effects = useStore(ctx.store, (state) => state.effects)

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
           
            extFilters.filters.forEach((k) => {
                const val = extFilters.filterValues[k]
                if (val) {
                    if (Array.isArray(val)) {
                        val.length > 0 && params.set(k, val.map(v => v.value).join(','))
                    } if (typeof val === 'object') {
                        val.value && params.set(k, val.value)
                    } else {
                        val.length > 0 && params.set(k, val)
                    }
                }

            })

            const getUrl = replaceTemplate(apiUrl, urlVars)
            const result = await apiGet(getUrl, params)
            const content = result.content ?? []
            const totalElements = result.totalElements ?? 0
            if (dataTable.mappingApi) {
                const dictUrl = replaceTemplate(dataTable.mappingApi, urlVars)
                const mappingData = await fetchPageMapping(id, dictUrl, params, urlVars)

                setMappingDict(mappingData || {})
            }
            
            setTableData(content)
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
    }, [id, page, pageSize, apiUrl, extFilters, effects])


    function renderTableToolBar() {
        const toolBar = tblView.toolBar
        if (!toolBar) return null

        // 左侧按钮
        const renderLeftBar = () => {
            const leftCfg = toolBar.left
            if (!leftCfg) return null

            const mainActions = (leftCfg.actions?.children || []).map((act: any) => {
                const oper = operations[act.id] ? { ...operations[act.id], ...act } : act
                return (
                    <Button
                        key={act.id}
                        variant={
                            oper.level === 'primary' ? 'default' : oper.level === 'danger' ? 'destructive' : 'outline'
                        }
                        className="mr-1 px-3 gap-1 text-sm font-normal rounded-sm"
                        onClick={async () => {
                            await handleOperation({ oper, ctx, urlVars });
                            } 
                        }
                    >
                        {oper.icon === 'FfPlus' ? <RiAddLine className="mr-0 h-4 w-4" /> : null}
                        {oper.label}
                    </Button>
                )
            })

            const moreActions = (leftCfg.actionMore?.children || []).map((act: any) => {
                const oper = operations[act.id] ? { ...operations[act.id], ...act } : act
                return(<DropdownMenuItem
                    key={oper.name}
                    className="w-full justify-start text-sm"
                    onClick={async () => { 
                        await handleOperation({ oper, ctx, urlVars })
                    }}
                >
                    {oper.label}
                </DropdownMenuItem>)
            })

            return (
                <div className="flex items-center">
                    {mainActions}
                    {moreActions.length > 0 && (
                        <div className="relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="mr-1 px-3 text-sm rounded-sm"> ... </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent sideOffset={0} align="end" className="w-40 p-2">
                                    {moreActions}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            )
        }

        // 右侧过滤和设置
        const renderRightBar = () => {
            const rightCfg = toolBar.right
            if (!rightCfg) return null
            return (
                <div className="flex items-center space-x-2 gap-2">
                    <TableFilterBar
                        bar={rightCfg}
                        dataTable={dataTableId}
                        dataTables={dataTables}
                        mappingDict={mappingDict}
                        onSearch={({ filters, filterValues }) => {
                            console.log('filters', filters)
                            setExtFilters({ filters, filterValues })
                            setPage(1)
                            setGoPage('1')
                        }}
                    />
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
                </div>
            )
        }

        return (
            <div className="flex items-center justify-between mb-1 w-full">
                <div className="flex space-x-2">{renderLeftBar()}</div>
                <div className="flex space-x-2">{renderRightBar()}</div>
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
                                    checked={selectedKeys.length === tableData.length && tableData.length > 0}
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
        if (!tableData.length && !loading) {
            return (
                <TableRow className="h-12">
                    <TableCell colSpan={mergedColumns.length} className="text-center">
                        暂无数据
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
                                    key={"oper:"+rowId}
                                    style={style}
                                    className="pt-1 pb-1 space-x-2 whitespace-nowrap overflow-hidden text-ellipsis"
                                >
                                    {comps?.map((c: string) => {
                                        const oper = operations[c]
                                        if (!oper) return null
                                        return (
                                            <Button
                                                key={"oper:" +rowId+":"+c}
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
        setGoPage(String(page > 1 ? page - 1 : 1))
    }

    function nextPage() {
        const totalPages = Math.ceil(total / pageSize)
        setPage(p => (p < totalPages ? p + 1 : totalPages))
        setGoPage(String(page < totalPages ? page + 1 : totalPages))
    }

    function handleGoPage() {
        let val = parseInt(goPage, 10) || 1
        const totalPages = Math.ceil(total / pageSize)
        if (val < 1) val = 1
        if (val > totalPages) val = totalPages
        setPage(val)
        setGoPage(String(val))
    }

    function renderPagination() {
        if (!tableFoot?.show) return null
        const totalPages = Math.ceil(total / pageSize) || 1
        const currCount = tableData.length
        const switchPageArr = (String(tableFoot.switchPage) || '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean)

        return (
            <div className="mt-1 flex items-center justify-between border-t p-1">
                <div className=" text-gray-600">
                    第 {page}/{totalPages} 页 / 当前页 {currCount} 条 / 总共 {total} 条
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                    <span>每页显示</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(val) => {
                            setPageSize(Number(val))
                            setPage(1)
                            setGoPage('1')
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
                    <span>前往</span>
                    <Input
                        className="w-14 h-8"
                        value={goPage}
                        onChange={(e) => setGoPage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleGoPage()
                        }}
                    />
                    <span>页</span>
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

