import React, {useContext } from 'react'
import { ViewComponentProps } from './types'
import { cn } from '@/lib/utils'
import { PageModelContext } from "@/context/page-context"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function DialogView({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">){
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
                {/* {renderChildren({id, vo, ...props, ...vo.props})} */}
            </DialogContent>
        </Dialog>
        
    )
}