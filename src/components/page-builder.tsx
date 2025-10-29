import React, { useEffect, useState, useContext, useRef } from "react"
import { PageModel, Operation, ViewObject, DataTable, DataField, MappingDict } from "@/types"
import { TablePageView } from "@/components/blocks/table-page-view"
import { FormPageView } from "@/components/blocks/form-page-view"
import { DashboardPageView } from "@/components/blocks/dashboard-page-view"
import { DrawerView  } from "@/components/blocks/drawer-view"
import { DialogView  } from "@/components/blocks/dialog-view"
import { Chart } from "@/components/blocks/chart"
import { PageModelContext } from "@/context/page-context"
import { ViewComponentProps } from "@/components/blocks/types" 
import { cn } from '@/lib/utils'


import { transformObject } from '@/lib/util_string'

function renderChildren({ id, vo,  ...props }: ViewComponentProps & React.ComponentProps<"div">) {
    if (!vo.children || !vo.children.length) return null
    const { children, ...others } = vo
    return children.map((child, idx) => {
        if (child.object) {
            return buildViewObject({ id, ...props, vo: child, key: `child-${idx}-${child.object}`})
        }
       
        return null
    })
}

const TabLayout = ({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">) => { 
    return <div key={vo.name} style={{ marginBottom: 16 }}>
        <h4>{vo.head?.title || vo.name}</h4>
        {(vo.children || []).map((tab: ViewObject, idx: number) => (
            <div key={tab.title || `tab-${idx}`} style={{ border: "1px dashed #888", marginTop: 8, padding: 8 }}>
                <h5>{tab.title}</h5>
                {renderChildren({ id, vo: tab, ...props })}
            </div>
        ))}
    </div>
}
const VBox = ({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">) => {
    return <div key={vo.name} className={cn("flex flex-col", vo.className)}>
        {renderChildren({ id, vo, ...props })}
    </div>
}

const HBox = ({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">) => {
    return <div key={vo.name} className={cn("flex", vo.className)}>
        {renderChildren({ id, vo, ...props })}
    </div>
}

const Text = ({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">) => {
    return <>{vo.value && vo.value}</>
}

const Tab = ({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">) => {
    return (
        <div key={vo.name} style={{ margin: "8px 0" }}>
            <h4>{vo.title}</h4>
            {renderChildren({ id, vo, ...props })}
        </div>
    )
}

const componentsRegistry: Record<string, React.ElementType> = {
    Drawer: DrawerView,
    Dialog: DialogView,
    Form: FormPageView,
    TableView: TablePageView,
    TabLayout,
    DashboardView: DashboardPageView,
    Tab,
    VBox,
    HBox,
    Chart,
    Text,
}

// buildViewObject 函数
export function buildViewObject( { key, vo, data, ...props }: ViewComponentProps&React.ComponentProps<"div">): React.ReactNode {
    const Comp = componentsRegistry[vo.object]
    if (!Comp) return <div key={key}> {renderChildren({vo, ...props })} </div>
    let viewObject = vo
    if (data) {
        viewObject = transformObject(vo, data||{})
    }
    return <Comp key={key} vo={viewObject} data={data} {...props}/>
}
