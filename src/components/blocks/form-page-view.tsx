import React, { useCallback,useEffect, useState, useContext, useMemo, use } from 'react'
import { Button } from '@/components/ui/button'
import { ViewComponentProps } from './types'
import { MappingDict, DataField } from '@/types'
import { fetchPageMapping } from "@/api/page"
import { apiGet } from "@/api/app"
import { cn } from '@/lib/utils'
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { renderEditElement } from './view-component'
import { getIcon } from '@/components/icons/dynamic-icon'
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { handleOperation } from "@/components/action"
import { useParams } from "react-router-dom";
import { useStore } from 'zustand'

export function FormPageView({ id, vo, dataTables, operations }: ViewComponentProps) {
    const ctx = useContext(PageModelContext);
    const pageViewCtx = useContext(PageViewContext);
    if (!ctx) throw new Error("must be used within PageModelProvider");
    if (!pageViewCtx) throw new Error("must be used within PageViewProvider");

    const [loading, setLoading] = useState(false)
    const [mappingDict, setMappingDict] = useState<MappingDict>()
    const dataTableId = vo.dataTable

    const formDataSelector = useCallback((state: any) => state.data[vo.id], [vo.id, dataTableId]);
    const setDataSelector = useCallback((state: any) => state.setData, []);
    const effectsSelector = useCallback((state: any) => state.effects, []);
    const viewStateSelector = useCallback((state: any) => state.viewState[vo.id], [vo.id]);

    const data = useStore(ctx.store, formDataSelector);
    const setData = useStore(ctx.store, setDataSelector);
    const effects = useStore(ctx.store, effectsSelector);
    const viewState = useStore(ctx.store, viewStateSelector);
   
    const apiUrl = vo.api
    const rowKey = vo.rowKey || 'id'
    
    const dataTable = dataTables[dataTableId]

    let defaultValues: Record<string, any> = {}
    if (vo.mode === 'edit') {
        defaultValues = ctx? ctx?.record||{} : {}
    }

    const urlVars: Record<string, string> = {}
    const urlParams = useParams();
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });

    if (vo.mode === 'create') {
        vo.children?.forEach(field => {
            const fieldCfg = dataTable.fields.find(f => f.id === field.id)
            if (fieldCfg && fieldCfg.defaultValue) {
                defaultValues[field.id] = fieldCfg.defaultValue
            }
        })
    }
    const [formData, setFormData] = useState<Record<string, any>>(defaultValues)
  
    
    // 加载数据&字典
    async function loadData() {
        setLoading(true)
        try {
            const params = new URLSearchParams(window.location.search)
            if (apiUrl && vo.mode === 'page') {
                const result = await apiGet(apiUrl, params)
                // 假设接口返回 data.content[0] 作为表单数据
                if (result?.content?.length) {
                    setFormData(result.content[0])
                }
            }
            if (dataTable.mappingApi) {
                const mappingData = await fetchPageMapping(id, dataTable.mappingApi, params, urlVars)
                setMappingDict(mappingData||{})
            }
        } catch (error) {
            console.error(error)
            toast.error('加载表单失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadData()
    }, [])

    // 根据字段id获取DataField
    function getFieldConfig(fieldId: string): DataField | undefined {
        return dataTable.fields.find(f => f.id === fieldId)
    }

    // 根据child设置的colSpan返回对应类名，默认为1
    function getColSpanClass(child: any) {
        const span = child.colSpan ? parseInt(child.colSpan) : 1
        // 只允许1到4的范围，其余重置为1
        const safeSpan = [1, 2, 3, 4].includes(span) ? span : 1
        // 针对sm和xl分别处理
        return `col-span-${safeSpan}`
    }

    function onFieldValueChange(field: string, value: any) {
        setFormData((prevRecord) => ({
            ...prevRecord,
            [field]: value,
        }))
    }
    // 递归渲染
    function renderChild(child: any) {
        if (child.object === 'Group') {
            const groupTitle = child.title || child.name
            return (
                <div key={groupTitle} className="p-3 border rounded-md mb-4">
                    {groupTitle && <div className="font-semibold mb-2">{groupTitle}</div>}
                    <div className={cn("grid grid-cols-1 gap-4", child.className)}>
                        {child.children?.map((sub: any) => renderChild(sub))}
                    </div>
                </div>
            )
        } else if (child.object === 'Element') {
            const fieldCfg = getFieldConfig(child.id)
            if (!fieldCfg) return null
            return (
                <div key={child.id} className={cn("flex flex-col", getColSpanClass(child))}>
                    <Label htmlFor={child.id} className="mb-1 font-normal">{fieldCfg.label}</Label>
                    {renderEditElement(formData, { ...fieldCfg, ...child}, dataTables, onFieldValueChange, mappingDict)}
                </div>
            )
        }
        // 其他类型先不处理
        return null
    }

    function renderFooter() {
        const footBar = vo.footer
        if (!footBar) return null

        // 左侧按钮
        const actions = (footBar.actions?.children || []).map((act: any) => {
            const oper = operations[act.id] ? { ...operations[act.id], ...act } : act

            return (
                <Button
                    key={oper.id}
                    variant={oper.level === 'primary' ? 'default' : oper.level === 'danger' ? 'destructive' : 'outline' }
                    className="mr-1 px-3 gap-1 text-sm font-normal rounded-sm"
                    onClick={async () => {
                        await handleOperation({ oper, ctx, record: formData, urlVars});
                    }}
                >
                    {oper.icon && getIcon(oper.icon)}
                    {oper.label}
                </Button>
            )
        })

        
        return (
            <div className="mt-4 space-x-2 flex justify-center">
                {actions}
            </div>
        )
    }

    return (
        <div className="w-full h-full overflow-hidden flex  justify-center">
            <div className={cn("rounded-sm border p-4 bg-white w-200")}>
                {/* 标题行 */}
                {vo.title && (
                    <div className="text-base font-semibold mb-4">
                        {vo.title}
                    </div>
                )}

                {vo.children ? (
                    <form onSubmit={e => e.preventDefault()}>
                        {vo.children.some((c: any) => c.object === 'Group') ? (
                            vo.children.map((c: any) => renderChild(c))
                        ) : (
                                <div className={cn("grid  gap-4", `grid-cols-${vo.cols? vo.cols:1}`, vo.className)}>
                                {vo.children.map((child: any) => renderChild(child))}
                            </div>
                        )}
                        {renderFooter()}
                        
                    </form>
                ) : (
                    <div>未配置表单元素</div>
                )}
            </div>
           
        </div>
    )
}