import { useEffect, useState } from "react"
import { DataField, MappingDict, DataTable } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MultipleSelector, { Option } from "@/components/ui/multiselect"
import { RiCloseLine, RiFilter3Line, RiSearchLine, RiResetLeftLine } from "@remixicon/react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface IFilterBar {
    object: string;
    name: string;
    isControl: boolean;
    isGroup: boolean;
    isMode: boolean;
    isReset: boolean;
    children: FilterBarElement[];
}

export interface FilterBarElement extends DataField {
    width?: string;
    dynamic?: boolean;
}

interface FilterBarProps {
    bar: IFilterBar
    dataTable: string
    dataTables: Record<string, DataTable>
    mappingDict?: MappingDict
    onSearch?: (params: { filters: string[]; filterValues: Record<string, any> }) => void
}


export function FilterBar({ bar, dataTable, dataTables, mappingDict, onSearch }: FilterBarProps) {
    const fields: Map<string, DataField> = new Map()
    const filterComps: Map<string, FilterBarElement> = new Map()
    dataTables[dataTable].fields.forEach((item) => {
        fields.set(item.id, item)
        if (item.isFilter) {
            filterComps.set(item.id, { ...item, dynamic: true })
        }
    })

    bar.children.forEach((item) => {
        const field = filterComps.get(item.id)
        if (field) {
            filterComps.set(item.id, { ...field, ...item })
        }
    })

    let filtersInit: string[] = []
    filterComps.forEach((item) => {
        if (!item.dynamic) {
            filtersInit.push(item.id)
        }
    })

    let filterList: FilterBarElement[] = []
    filterComps.forEach((item) => {
        filterList.push(item)
    })

    const [filters, setFilters] = useState<string[]>(filtersInit)

    const [filterValues, setFilterValues] = useState<Record<string, any>>({})

    const handleRemoveDynamic = (fieldId: string) => {
        console.log('handleRemoveDynamic', fieldId)
        setFilters((prev) => prev.filter((v)=>v != fieldId))
    }

    const handleValueChange = (id: string, value: any) => {
        setFilterValues((prev) => ({
            ...prev,
            [id]: value
        }))
    }

    function renderFilterItem(id: string, idx: number) {
        const fieldDef = filterComps.get(id)
        if (!fieldDef) return null

        const isDynamic = !!fieldDef.dynamic
        const dictItems = fieldDef.source && mappingDict?.[fieldDef.source]
        // 组装下拉选项
        const options: Option[] = dictItems && dictItems.options ? dictItems.options.map((v) => ({ value: v.value, label: v.label })) : []

        // 简化仅示例 input-text / select
        if (fieldDef.component === "select") {
            // 多选
            const selValue = filterValues[fieldDef.id] || []
            return (
                <div key={id} className="flex items-center mr-1">
                    <MultipleSelector
                        key={fieldDef.id}
                        className={ isDynamic ? "*:not-first:mt-1 mr-0 rounded-sm rounded-r-none min-h-[30px]" : "*:not-first:mt-1 mr-2" }
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
                            onClick={() => handleRemoveDynamic(fieldDef.id)}
                            className="gap-0 p-0 m-0 bg-[#eeeeee] hover:bg-[#e5e7eb] w-4 rounded-sm rounded-l-none"
                        >
                            <RiCloseLine className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )
        } else {
            // 文本框
            const textValue = filterValues[fieldDef.id] || ""
            return (
                <div key={id} className="flex items-center mr-1">
                    <Input
                        placeholder={fieldDef.label}
                        className={ isDynamic ? "mr-0 rounded-sm rounded-r-none" : "mr-2" }
                        value={textValue}
                        onChange={(e) => handleValueChange(fieldDef.id, e.target.value)}
                    />
                    {isDynamic && (
                        <Button
                            variant="outline"
                            onClick={() => handleRemoveDynamic(fieldDef.id)}
                            className="gap-0 p-0 m-0 bg-[#eeeeee] hover:bg-[#e5e7eb] w-4 rounded-sm rounded-l-none"
                        >
                            <RiCloseLine className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )
        }
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
        onSearch?.({ filters, filterValues })
    }

    // 重置筛选
    const handleReset = () => {
        setFilters(filtersInit)
        setFilterValues({})
        onSearch?.({ filters: filtersInit, filterValues: {} })
    }

    return (
        <div className="flex items-center text-xs">
            {filters.map((fid, idx) => renderFilterItem(fid, idx))}

            <div className="relative">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-1">
                            <RiFilter3Line className="mr-1 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={0} align="end" className="w-40 p-2">
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
            </div>

            <Button
                className="w-15 gap-0 px-4 text-sm rounded-sm rounded-r-none"
                onClick={handleSearch}
            >
                <RiSearchLine className="mr-0 h-4 w-4" />
                查询
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="gap-0 m-l-[-2] rounded-l-none"
            >
                <RiResetLeftLine className="h-6 w-6" />
            </Button>
        </div>
    )
}
