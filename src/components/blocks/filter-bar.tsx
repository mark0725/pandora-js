import React, { useEffect, useState, useCallback, CSSProperties, useContext } from 'react'
import { DataField, MappingDict, DataTable } from "@/types"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import MultipleSelector, { Option } from "@/components/ui/multiselect"
import { RiCloseLine, RiFilter3Line, RiSearchLine, RiResetLeftLine } from "@remixicon/react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { ViewComponentProps, RowData, TableBodyColumn } from './types'
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { handleOperation } from "@/components/action"
import { useParams } from "react-router-dom";
import { useStore } from 'zustand'
import { toast } from 'sonner'
import { XIcon } from "lucide-react";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export interface IFilterBar {
    object: string;
    name: string;
    isReset: boolean;
    children: FilterBarElement[];
}

export interface FilterBarElement extends DataField {
    width?: string;
    dynamic?: boolean;
}

enum typeEnum {
    STRING = 'string',
    NUMBER = 'number',
    SELECT = 'select',
    DATE = 'date',
}

const typeOprMap: Record<typeEnum, Option[]> = {
    [typeEnum.STRING]: [
        // { label: '开头是', value: 'begin-with' },
        // { label: '开头不是', value: 'not-begin-with' },
        // { label: '结尾是', value: 'end-with' },
        // { label: '结尾不是', value: 'not-end-with' },
        { label: '模糊匹配', value: 'like' },
        { label: '等于', value: '=' },
        { label: '不等于', value: '<>' },
        { label: '为空', value: 'is-null' },
        { label: '不为空', value: 'is-not-null' },
    ],
    [typeEnum.NUMBER]: [
        { label: '等于', value: '=' },
        { label: '不等于', value: '<>' },
        { label: '大于', value: '>' },
        { label: '小于', value: '<' },
        { label: '大于等于', value: '>=' },
        { label: '小于等于', value: '<=' },
        { label: '介于', value: '-' },
        { label: '为空', value: 'is-null' },
        { label: '不为空', value: 'is-not-null' },
    ],
    [typeEnum.SELECT]: [
        { label: '包含', value: 'in' },
        { label: '不包含', value: 'not-in' },
        { label: '为空', value: 'is-null' },
        { label: '不为空', value: 'is-not-null' },
    ],
    [typeEnum.DATE]: [
        { label: '等于', value: '=' },
        { label: '大于', value: '>' },
        { label: '小于', value: '<' },
        { label: '大于等于', value: '>=' },
        { label: '小于等于', value: '<=' },
        { label: '介于', value: '-' },
        { label: '为空', value: 'is-null' },
        { label: '不为空', value: 'is-not-null' },
    ],
};

const componentTypeMap: any = {
    "input-text": {type:typeEnum.STRING, defaultValue:'like'},
    "input-date": { type: typeEnum.DATE, defaultValue: '=' },
    "input-number": { type: typeEnum.NUMBER, defaultValue: '=' },
    "textarea": { type: typeEnum.STRING, defaultValue: 'like' },
    "input-tag": { type: typeEnum.STRING, defaultValue: 'in' },
    "select": { type: typeEnum.SELECT, defaultValue: 'in' },
};

interface FilterItem {
    key: string
    type: typeEnum
    type_value: string
    value: string[]|string|number
}


interface FilterParam {
    opr: string
    items: FilterItem[]
}

export function FilterBar({ id, vo, dataTables, operations, dict, dataTableId }: ViewComponentProps&React.ComponentProps<"div">) {
    const ctx = useContext(PageModelContext);
    const pageViewCtx = useContext(PageViewContext);
    if (!ctx) throw new Error("must be used within PageModelProvider");
    if (!pageViewCtx) throw new Error("must be used within PageViewProvider");

    const urlParams = useParams();
    const urlVars: Record<string, string> = {}
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });

    const fields: Map<string, DataField> = new Map()
    const filterComps: Map<string, FilterBarElement> = new Map()
    dataTables[dataTableId].fields.forEach((item) => {
        fields.set(item.id, item)
        if (item.isFilter) {
            filterComps.set(item.id, { ...item, dynamic: true })
        }
    })

    vo.children.forEach((item) => {
        const field = filterComps.get(item.id)
        if (field) {
            filterComps.set(item.id, { ...field, ...item })
        }
    })

    let filtersInit: string[] = []
    let filterOpsInit: Record<string, string> = {}
    filterComps.forEach((item) => {
        filterOpsInit[item.id] = item.filterOps || '='
        if (componentTypeMap[item.component]){
            filterOpsInit[item.id] = componentTypeMap[item.component].defaultValue
            if (item.filterOps) {
                const fieldOprs = item.filterOps.split(',')
                if (!fieldOprs.includes('*') && fieldOprs.length > 0) {
                    filterOpsInit[item.id] = fieldOprs[0]
                }

            }
        }

        if (!item.dynamic) {
            filtersInit.push(item.id)
        }
    })

    let filterList: FilterBarElement[] = []
    filterComps.forEach((item) => {
        filterList.push(item)
    })

    const [filters, setFilters] = useState<string[]>(filtersInit)
    const [filterOps, setFilterOps] = useState<Record<string, string>>(filterOpsInit)

    const [filterValues, setFilterValues] = useState<Record<string, any>>({})

    const handleRemoveDynamic = (fieldId: string) => {
        setFilters((prev) => prev.filter((v)=>v != fieldId))
    }

    const handleValueChange = (id: string, value: any) => {
        setFilterValues((prev) => ({
            ...prev,
            [id]: value
        }))
    }

    // 点击新增/移除动态筛选项
    function handleCheckFilter(id: string, checked: boolean) {
        setFilters((prev) => {
            if (checked) {
                // 如果已存在则不重复
                if (!prev.includes(id)) {
                    return [...prev, id]
                }
                return prev
            } else {
                // 移除
                return prev.filter((f) => f !== id)
            }
        })
    }

    // 点击查询
    const handleSearch = () => {
        if (!vo.onQuery) {
            return
        }
        const oper = operations[vo.onQuery]
        if (!oper) {
            toast.error('No operation found for id: ' + vo.onQuery)
            return
        }

        let filterParams: FilterParam = {opr:"and", items: []}
        Object.keys(filterValues).forEach((k) => {
            const val = filterValues[k]
            let componentType = componentTypeMap[fields.get(k)?.component].type||"string"
           
            if (val) {
                let paraVal = null
                if (Array.isArray(val)) {
                    val.length > 0 && (paraVal = val.map(v => v.value))
                } if (typeof val === 'object') {
                    val.value && (paraVal = val.value)
                } else {
                    val.length > 0 && (paraVal = val)
                }

                filterParams.items.push({
                    key: k,
                    type: componentType,
                    type_value: filterOps[k],
                    value: paraVal
                })
                
            }

        })
        handleOperation({ oper, ctx, urlVars, record: { filter: filterParams } });
    }

    // 重置筛选
    const handleReset = () => {
        setFilters(filtersInit)
        setFilterValues({})
        if (!vo.onQuery) {
            return
        }
        const oper = operations[vo.onQuery]
        if (!oper) {
            toast.error('No operation found for id: ' + vo.onQuery)
            return
        }

        handleOperation({ oper, ctx, urlVars, record: { filter: {} } });
    }
    function renderFilterItem(id: string, idx: number) {
        const fieldDef = filterComps.get(id)
        if (!fieldDef) return null
        
        const isDynamic = !!fieldDef.dynamic
        const dictItems = fieldDef.source && dict?.[fieldDef.source]
        // 组装下拉选项
        const options: Option[] = dictItems && dictItems.options ? dictItems.options.map((v) => ({ value: v.value, label: v.label })) : []
        const fieldOprs = fieldDef.filterOps ? fieldDef.filterOps.split(',') : []
        
        // 简化仅示例 input-text / select
        if (fieldDef.component === "select") {
            // 多选
            const selValue = filterValues[fieldDef.id] || []
            return (
                <ButtonGroup key={fieldDef.id}>
                    <MultipleSelector
                        className={cn("*:not-first:mt-1", isDynamic && "rounded-sm rounded-r-none min-h-[30px]")}
                        commandProps={{ label: fieldDef.label, className: "top-1 z-12" }}
                        value={selValue}
                        options={options}
                        placeholder={fieldDef.label}
                        hidePlaceholderWhenSelected
                        emptyIndicator={<p className="text-center text-sm">没有内容</p>}
                        onChange={(vals) => handleValueChange(fieldDef.id, vals)}
                    />
                    {isDynamic && (
                        <Button
                            variant="outline"
                            size="icon" 
                            onClick={() => handleRemoveDynamic(fieldDef.id)}
                            className="bg-[#eeeeee] hover:bg-[#e5e7eb] w-4"
                        >
                            <RiCloseLine className="h-4 w-4" />
                        </Button>
                    )}
                </ButtonGroup>
            )
        } 

        const opOptions: Option[] = typeOprMap[componentTypeMap[fieldDef.component].type].filter((v) => fieldOprs.includes('all') || fieldOprs.includes(v.value))
        // 文本框
        const textValue = filterValues[fieldDef.id] || ""
        return (
            <ButtonGroup key={fieldDef.id}>
                <InputGroup>
                    {opOptions.length>1 && (
                        <Select
                            value={filterOps[fieldDef.id]}
                            onValueChange={(v) => {
                                setFilterOps((prev) => ({
                                    ...prev,
                                    [fieldDef.id]: v
                                }))
                            }}
                        >
                            <SelectTrigger className="w-28 text-sm rounded-sm rounded-r-none ">
                                <SelectValue placeholder="" />
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    opOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    )}
                    <InputGroupInput 
                        placeholder={fieldDef.label} 
                        value={textValue} 
                        onChange={(e) => handleValueChange(fieldDef.id, e.target.value)} 
                    />
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton
                            aria-label="清除"
                            title="清除"
                            size="icon-xs"
                            onClick={()=>{handleValueChange(fieldDef.id, "")}}
                        >
                            {textValue && <XIcon />}
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>
              
                {isDynamic && (
                    <Button
                        variant="outline"
                        size="icon" 
                        onClick={() => handleRemoveDynamic(fieldDef.id)}
                        className=" bg-[#eeeeee] hover:bg-[#e5e7eb]  w-4"
                    >
                        <RiCloseLine className="h-4 w-4" />
                    </Button>
                )}
            </ButtonGroup>
        )
    }


    return (
        <div className="flex items-center text-xs space-x-1">
            {filters.map((fid, idx) => renderFilterItem(fid, idx))}
            <ButtonGroup>
                <ButtonGroup className="hidden sm:flex">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" >
                                <RiFilter3Line/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent sideOffset={0} align="end">
                            {filterList.map((item) => {
                                const isDynamic = !!item.dynamic
                                if (!isDynamic) return null
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={item.id}
                                        checked={filters.includes(item.id)}
                                        onCheckedChange={(checked) => handleCheckFilter(item.id, checked)}
                                    >
                                        {item.label}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
            </ButtonGroup>
            <ButtonGroup>
                <Button className="text-sm rounded-sm" onClick={handleSearch} >
                    <RiSearchLine/> 查询
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                    <RiResetLeftLine/>
                </Button>
            </ButtonGroup>
            </ButtonGroup>
        </div>
    )
}
