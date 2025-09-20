import React, {useContext} from "react"
import { PageModelContext } from "@/context/page-context"
import { ViewComponentProps } from "@/components/blocks/types"

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
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"


export function DrawerView({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">) {
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
                {/* {renderChildren({ id, vo, ...props })} */}
                <DrawerFooter>

                </DrawerFooter>
            </DrawerContent>
        </Drawer>

    )
}
