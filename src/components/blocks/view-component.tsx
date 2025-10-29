import React, {CSSProperties} from "react"
import { DataField, MappingDict, DataTable, DictItem } from "@/types"
import { TableBodyColumn } from "./types"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { InputTag } from "@/components/ui/input-tag";
import MultipleSelector, { Option } from "@/components/ui/multiselect"
import { SelectSearch, Option as SearchOption} from "@/components/ui/select-search"
import { MinusIcon, PlusIcon } from "lucide-react"
import { Button, Group, Input as NumberInput,  NumberField } from "react-aria-components"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { on } from "events"

function lightenColor(hex: string, amount = 0.7) {
    // hex to rgb
    let c = hex.substring(1);
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const num = parseInt(c, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;

    // 混合白色
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function formatDateTime(value: string, fmt: string): string {
    // 假设 value 始终是14位的时间字符串
    if (value.length !== 14) throw new Error('时间格式不正确');
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    const hour = value.slice(8, 10);
    const minute = value.slice(10, 12);
    const second = value.slice(12, 14);
    return fmt
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hour)
        .replace('mm', minute)
        .replace('ss', second);
  }

export function renderTableElement(fieldValue: any, field: TableBodyColumn, dataTables?: Record<string, DataTable>, mappingDict?: MappingDict) {
    // 字典项渲染函数
    function renderDictValue(value: string, source?: string) {
        if (!source || !mappingDict?.[source]) return value
        const entry = mappingDict[source].items[value]
        if (!entry) return value
        
        let variant: "default" | "secondary" | "outline" | "destructive" = "default"
        if (entry.style === "secondary") variant = "secondary"
        if (entry.style === "outline") variant = "outline"
       
        const style: CSSProperties = {  }
        if (entry.color) {
            if (entry.style === "outline") {
                style.color = entry.color
                style.borderColor = entry.color
            } else if (entry.style === "secondary") {
                style.color = entry.color
                style.backgroundColor = entry.color? lightenColor(entry.color, 0.7): entry.color
                style.borderRadius = "2px"
            } else {
                style.backgroundColor = entry.color
                style.color = "white"
            }
        }
        
        if (entry.color) {
            return (
                <Badge key={value} variant={variant} style={style} className="text-xs font-normal">
                    {entry.label ?? value}
                </Badge>
            )
        }
        return entry.label ?? value
    }

    // 渲染多值字典（例如多选或 tag）
    function renderMultiValue(vals: string[], source?: string) {
        return (
            <>
                {vals.map((v, i) => (
                    <span key={i} className="mr-1">
                        {renderDictValue(v.trim(), source)}
                    </span>
                ))}
            </>
        )
    }

    switch (field.component) {
        case "input-text":
        case "textarea": {
            // 普通文本
            return <span>{fieldValue ?? ""}</span>
        }

        case "input-tag": {
            // 以逗号分隔
            if (!fieldValue) return null
            const tags = typeof fieldValue === "string" ? fieldValue.split(",") : []
            // 直接渲染为文本或可进一步封装成标签
            return renderMultiValue(tags, undefined)
        }

        case "select": {
            // 多选
            if (field.multiple) {
                const values = typeof fieldValue === "string" ? fieldValue.split(",") : []
                if (values.length === 0) return <span>-</span>
                return renderMultiValue(values, field.source)
            } else {
                // 单选
                if (!fieldValue) return <span>-</span>
                return <>{renderDictValue(fieldValue, field.source)}</>
            }
        }

        case "input-date": {
            // 简单输出
            if (!fieldValue) return <span>-</span>
            // 可在此按需格式化
            return <span>{formatDateTime(fieldValue, field.inputFormat||"YYYY-MM-DD")}</span>
        }

        default: {
            // 其他类型默认以文本方式显示
            return <span>{fieldValue ?? ""}</span>
        }
    }
}

export function renderViewElement(fieldValue: any, field: DataField, dataTables: Record<string, DataTable>, mappingDict?: MappingDict) {
    // 此示例保留原逻辑不变，根据需要自行扩展
    switch (field.component) {
        case "input-text":
        case "select":
        case "input-tag":
        case "textarea":
        case "input-date":
        default:
            return <span>{fieldValue ?? ""}</span>
    }
}

export function renderEditElement(
    data: Record<string, any>,
    field: DataField,
    dataTables: Record<string, DataTable>,
    onChange: (field:string, value: any) => void,
    mappingDict?: MappingDict,
) {
    const placeholder = field.label || field.id;
    const fieldValue = data[field.id]

    let dictItems = field.source && mappingDict?.[field.source];
    
    if (field.component === "select" && field.selectFilterBy && dictItems) {
        const [filterName,filterKey] = field.selectFilterBy.split(":")
        console.log("filterName",filterName)
        console.log("filterKey",filterKey)
        console.log(dictItems)
        dictItems = { ...dictItems}
        console.log(data)
        dictItems.options = dictItems.options.filter((v) => v.fields && v.fields[filterKey] === data[filterName])
        dictItems.items = dictItems.options.reduce((acc: Record<string, DictItem>, v) => {
            acc[v.value] = v
            return acc
        }, {})
        console.log(dictItems)
    }

    if (field.component === "select" && field.multiple) {
        const values = typeof fieldValue === "string" && fieldValue.length>0? fieldValue.split(",") : []
        const values2: Option[] = values && values.length>0? values.map((v: string) => ({
            value: v,
            label: dictItems? dictItems.items[v].label || v : v
        })):[]
        const options: Option[] = dictItems && dictItems.options ?  dictItems.options.map((v) => ({ value: v.value, label: v.label})):[]
       
        return (
            <MultipleSelector
                key={field.id}
                commandProps={{ label: field.label, className: "top-1" }}
                value={values2}
                options={options}
                placeholder={placeholder}
                hidePlaceholderWhenSelected
                emptyIndicator={<p className="text-center text-sm">没有内容</p>}
                onChange={(vals) => {
                        onChange(field.id, vals&&vals.length>0? vals.map(val => val.value).join(","):"")
                    } }
                disabled={field.disabled}
            />
                
        )
    } else if (field.component === "select" && field.searchable){
        const options: SearchOption[] = dictItems && dictItems.options ? dictItems.options.map((v) => ({ value: v.value, label: v.label })) : []

        return (
            <SelectSearch
                key={field.id}
                value={fieldValue}
                options={options}
                placeholder={placeholder}
                onChange={(value) => {
                    onChange(field.id, value.value)
                }}
                disabled={false}
                emptyIndicator={<p className="text-center text-sm">没有内容</p>}
            />

        )
    } else if (field.component === "select") {
        return (
            <Select key={field.id} value={fieldValue} onValueChange={(value) => onChange(field.id, value)} disabled={field.disabled}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {dictItems && dictItems.options && dictItems.options.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                            {v.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    switch (field.component) {
        case "input-text":
            return (
                <Input
                    key={field.id}
                    value={fieldValue || ""}
                    disabled={field.disabled}
                    placeholder={placeholder}
                    onChange={(e) => onChange(field.id, e.target.value)}
                />
            );
        case "input-tag":
            const values = typeof fieldValue === "string" ? fieldValue.split(",") : []
            return (
                <InputTag
                    key={field.id}
                    value={values}
                    disabled={field.disabled}
                    placeholder={placeholder}
                    onChange={(value) => onChange(field.id, value.join(","))}
                />
            );
        case "textarea":
            return (
                <Textarea
                    key={field.id}
                    value={fieldValue || ""}
                    disabled={field.disabled}
                    placeholder={placeholder}
                    onChange={(event) => onChange(field.id, event.target.value)}
                />
            );
        case "input-date":
            return (
                <Input
                    key={field.id}
                    type="date"
                    value={fieldValue || ""}
                    disabled={field.disabled}
                    placeholder={placeholder}
                    onChange={(value) => onChange(field.id, value)}
                />
            );
        case "input-number":
            return (<NumberField key={field.id} value={fieldValue || ""}  isDisabled={field.disabled}  onChange={(value) => onChange(field.id, value)} >
                <div className="*:not-first:mt-2">
                   
                    <Group className="border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:opacity-50 data-focus-within:ring-[3px]">
                        <Button
                            slot="decrement"
                            className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -ms-px flex aspect-square h-[inherit] items-center justify-center rounded-s-md border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <MinusIcon size={16} aria-hidden="true" />
                        </Button>
                        <NumberInput className="bg-background text-foreground w-full grow px-3 py-2 text-center tabular-nums" />
                        <Button
                            slot="increment"
                            className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -me-px flex aspect-square h-[inherit] items-center justify-center rounded-e-md border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <PlusIcon size={16} aria-hidden="true" />
                        </Button>
                    </Group>
                </div>
               
            </NumberField>)
        default:
            return (
                <Input
                    key={field.id}
                    value={fieldValue || ""}
                    disabled={field.disabled}
                    placeholder={placeholder}
                    onChange={(value) => onChange(field.id, value)}
                />
            );
    }
}