import React, { useEffect, useState, useContext, useRef } from "react"
import { PageModel, Operation, ViewObject, DataTable, DataField, MappingDict } from "@/types"
import { TablePageView } from "@/components/blocks/table-page-view"
import { FormPageView } from "@/components/blocks/form-page-view"
import { DashboardPageView } from "@/components/blocks/dashboard-page-view"
import { Chart } from "@/components/blocks/chart"
import { PageModelContext } from "@/context/page-context"
import { ViewComponentProps } from "@/components/blocks/types" 
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from '@/lib/utils'
import {
    RiListView,
    RiCloseLine,
} from "@remixicon/react"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
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


const DrawerView = ({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">) => {
    const [open, setOpen] = React.useState(true);
    const ctx = useContext(PageModelContext);
    if (!ctx) throw new Error("CounterDisplay must be used within CounterProvider");
    const onOpenChange = (open: boolean) => {
        setOpen(false)
        ctx.closeView(id)
    }
    return (
        <Drawer
            direction="right"
            open={open}
            onOpenChange={onOpenChange}
            repositionInputs={true}
            container={ctx.container}
        >
            <DrawerContent className={cn("z-49 flex-1 absolute rounded-none overflow-hidden !max-w-200 !sm:max-w-400", vo.className)}>
                <DrawerHeader className="flex flex-row p-1 justify-between">
                    <div className="p-2">
                        <DrawerTitle className="text-base font-semibold mb-4">{vo.title}</DrawerTitle>
                        <DrawerDescription>{vo.desc && vo.desc}</DrawerDescription>
                    </div>
                    <div>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon"><RiCloseLine className="mr-0 h-4 w-4" /></Button>
                        </DrawerClose>
                    </div>

                </DrawerHeader>
                {renderChildren({ id, vo, ...props })}
                <DrawerFooter>

                </DrawerFooter>
            </DrawerContent>
        </Drawer>

    )
}

const DialogView = ({ id, vo, ...props }: ViewComponentProps&React.ComponentProps<"div">) => {
    const [open, setOpen] = React.useState(true);
    const ctx = useContext(PageModelContext);
    if (!ctx) throw new Error("CounterDisplay must be used within CounterProvider");
    const onOpenChange = (open: boolean) => {
        setOpen(false)
        ctx.closeView(id)
    }

    return (
        <Dialog key={vo.name} defaultOpen={true} open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-200", vo.className)}>
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">{vo.title}</DialogTitle>
                    <DialogDescription>{vo.desc&&vo.desc}</DialogDescription>
                </DialogHeader>
                {renderChildren({id, vo, ...props, ...vo.props})}
            </DialogContent>
        </Dialog>
        
    )
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
