import React, { useContext, useState, useEffect } from 'react'
import { ViewComponentProps } from './types'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { PageModelContext, PageViewContext } from "@/context/page-context"

// 尺寸模式类型
type SizeMode = 'auto' | 'fixed' | 'max' | 'min' | 'fullscreen';

interface DialogViewProps extends ViewComponentProps {
    sizeMode?: SizeMode; // 尺寸模式
    width?: number | string; // 固定宽度
    height?: number | string; // 固定高度
    minWidth?: number; // 最小宽度
    minHeight?: number; // 最小高度
    maxWidth?: number; // 最大宽度
    maxHeight?: number; // 最大高度
}

export function DialogView({
    id,
    vo,
    sizeMode = 'auto',
    width,
    height,
    minWidth = 200,
    minHeight = 200,
    maxWidth = 800,
    maxHeight = 600,
    ...props
}: DialogViewProps & React.ComponentProps<"div">) {
    const ctx = useContext(PageModelContext);
    const pageViewCtx = useContext(PageViewContext);

    if (!ctx) throw new Error("must be used within PageModelProvider");
    if (!pageViewCtx) throw new Error("must be used within PageViewProvider");

    const [open, setOpen] = useState(true);
    const [contentStyle, setContentStyle] = useState<React.CSSProperties>({});
    const [contentClassName, setContentClassName] = useState<string>('');

    // 根据尺寸模式计算样式
    useEffect(() => {
        let style: React.CSSProperties = {};
        let className = '';

        switch (sizeMode) {
            case 'auto':
                // 自动大小，内容自适应
                //className = 'w-auto h-auto';
                break;

            case 'fixed':
                // 固定大小
                style = {
                    width: typeof width === 'number' ? `${width}px` : width,
                    height: typeof height === 'number' ? `${height}px` : height,
                };
                break;

            case 'max':
                // 最大尺寸
                style = {
                    maxWidth: `${maxWidth}px`,
                    maxHeight: `${maxHeight}px`,
                    width: '100%',
                    height: 'auto',
                };
                break;

            case 'min':
                // 最小尺寸
                style = {
                    minWidth: `${minWidth}px`,
                    minHeight: `${minHeight}px`,
                    width: 'auto',
                    height: 'auto',
                };
                break;

            case 'fullscreen':
                // 全屏模式
                className = 'w-screen h-screen max-w-none';
                style = {
                    margin: 0,
                    borderRadius: 0,
                };
                break;

            default:
                className = 'sm:max-w-[425px]';
        }

        setContentStyle(style);
        setContentClassName(className);
    }, [sizeMode, width, height, minWidth, minHeight, maxWidth, maxHeight]);

    const onOpenChange = (open: boolean) => {
        setOpen(false);
        ctx.closeView(id);
    };

    return (
        <Dialog key={vo.name} defaultOpen={true} open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn("sm:max-w-200", contentClassName, vo.className)}
                style={contentStyle}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">
                        {vo.title}
                    </DialogTitle>
                    {vo.desc && (
                        <DialogDescription>{vo.desc}</DialogDescription>
                    )}
                </DialogHeader>

                <div className={cn(
                    "overflow-auto",
                    sizeMode === 'fullscreen' ? 'flex-1' : ''
                )}>
                    {vo.children && vo.children.map((child, index) => (
                        child.object && ctx.buildViewObject({
                            id,
                            ...props,
                            vo: child,
                            key: `child-${index}-${child.object}`
                        })
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}