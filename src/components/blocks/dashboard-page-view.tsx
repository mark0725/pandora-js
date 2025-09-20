"use client"
import React, { useEffect, useState, CSSProperties, useContext } from 'react'
import { useParams } from "react-router-dom";
import { MappingDict, Operation } from '@/types'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
    CardAction,
} from "@/components/ui/card"
import type { MenuItem, PageLayoutConfig, ViewObject } from "@/types"
import { ViewComponentProps, RowData } from './types'
import { cn } from '@/lib/utils'
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { useStore } from 'zustand'
import { transformObject } from '@/lib/util_string'

// function DashboardItem(props: DashboardItemProps)
export function DashboardPageView({ id, vo, dataTables, operations }: ViewComponentProps&React.ComponentProps<"div">) {
    const ctx = useContext(PageModelContext);
    const pageViewCtx = useContext(PageViewContext);
    if (!ctx) throw new Error("must be used within PageModelProvider");
    if (!pageViewCtx) throw new Error("must be used within PageViewProvider");

    const pageData = useStore(ctx.store, (state) => state.data[vo.__data||vo.id])
    
    const urlParams = useParams();
    const urlVars: Record<string, string> = {}
    const dashboardView = vo
    const apiUrl = dashboardView.api
    const rowKey = dashboardView.rowKey || 'id'
    const dataTableId = dashboardView.dataTable
    const dataTable = dataTables[dataTableId] || { fields: [] }
    const { rows, cols } = vo
    //const { id, path } = props

    return (
        <div className={cn("*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card  *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs h-full grid flex-1  gap-1 2xl:gap-2 overflow-hidden",  "grid-cols-" + cols || "2", "grid-rows-" + rows||"2", vo.className?vo.className:"")}>
            
            {vo.children && vo.children.map((child: any, index:number) => (
                <Card key={id + ":" + index} className={cn("@container/card flex overflow-hidden", child.colSpan && "col-span-" + child.colSpan, child.rowSpan && "row-span-" + child.rowSpan)}>
                        <CardHeader className="items-center pb-0">
                            {
                            child.header ? (
                                child.header?.children && child.header.children.map((ele: ViewObject, i: number) => {
                                    const viewObject = transformObject(ele, pageData)
                                    //const viewObject =  ele
                                    if (viewObject.object && viewObject.object === 'Title') return (<CardTitle key={i} className={cn(viewObject.className)}>{viewObject.value && viewObject.value}</CardTitle>)
                                    if (viewObject.object && viewObject.object === 'Description') return (<CardDescription key={i} className={cn(viewObject.className)}>{viewObject.value && viewObject.value}</CardDescription>)
                            })) : ( <CardDescription>{child.title && child.title} </CardDescription>)
                            }
                            
                        </CardHeader>
                    {child.children && <CardContent className="flex-1 pb-0">
                            {child.children && child.children.map((ele: ViewObject, i: number) => (
                                ctx.buildViewObject({ id: (child.id || index) + ":" + i, vo: ele, dataTables, operations, data:pageData, key: index+":"+ i} as ViewComponentProps & React.ComponentProps<"div">)
                            ))}
                        </CardContent>}
                    {child.footer &&<CardFooter className={cn("flex-col text-sm", child.footer?.className)}>
                       
                        {child.footer?.children && child.footer.children.map((ele: ViewObject, i: number) => (
                            ctx.buildViewObject({ id: (child.id || index) + ":" + i, vo: ele, dataTables, operations, data:pageData, key: id + i } as ViewComponentProps & React.ComponentProps<"div">)
                        ))}
                        </CardFooter>}
                    </Card>
            ))}
            

        </div>
    )
}
