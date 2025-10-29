import React, { useContext, useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { RiCloseLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { ViewComponentProps } from './types'
import { PageModelContext, PageViewContext } from "@/context/page-context"

interface DrawerViewProps extends ViewComponentProps {
    direction?: 'left' | 'right' | 'top' | 'bottom';
    minSize?: number; // 最小尺寸（宽度或高度）
    maxSize?: number; // 最大尺寸（宽度或高度）
    defaultSize?: number; // 默认尺寸
}

export function DrawerView ({ id, vo, direction = 'right', minSize = 200, maxSize = 800, defaultSize = 400, ...props }: DrawerViewProps & React.ComponentProps<"div">) {
    const ctx = useContext(PageModelContext);
    const pageViewCtx = useContext(PageViewContext);
    if (!ctx) throw new Error("must be used within PageModelProvider");
    if (!pageViewCtx) throw new Error("must be used within PageViewProvider");
    

    const [open, setOpen] = useState(true);
    const [size, setSize] = useState(defaultSize);
    const [isResizing, setIsResizing] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const onOpenChange = (open: boolean) => {
        setOpen(false);
        ctx.closeView(id);
    };

    const isHorizontal = direction === 'left' || direction === 'right';

    // 处理鼠标按下开始调整大小
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    // 处理鼠标移动调整大小
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !drawerRef.current) return;

            const container = ctx.container || document.body;
            const containerRect = container.getBoundingClientRect();
            let newSize: number;

            if (isHorizontal) {
                if (direction === 'right') {
                    newSize = containerRect.right - e.clientX;
                } else {
                    newSize = e.clientX - containerRect.left;
                }
            } else {
                if (direction === 'bottom') {
                    newSize = containerRect.bottom - e.clientY;
                } else {
                    newSize = e.clientY - containerRect.top;
                }
            }

            // 限制在最小和最大尺寸之间
            newSize = Math.max(minSize, Math.min(maxSize, newSize));
            setSize(newSize);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = isHorizontal ? 'ew-resize' : 'ns-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, direction, isHorizontal, minSize, maxSize, ctx.container]);

    // 获取调整器的位置样式
    const getResizerStyle = (): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            position: 'absolute',
            zIndex: 50,
           // backgroundColor: 'transparent',
            transition: isResizing ? 'none' : 'background-color 0.2s',
        };

        if (isHorizontal) {
            return {
                ...baseStyle,
                [direction === 'right' ? 'left' : 'right']: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                cursor: 'ew-resize',
                backgroundColor: isResizing ? 'rgb(59, 130, 246)' : 'transparent', // 蓝色
            };
        } else {
            return {
                ...baseStyle,
                [direction === 'bottom' ? 'top' : 'bottom']: 0,
                left: 0,
                right: 0,
                height: '4px',
                cursor: 'ns-resize',
                backgroundColor: isResizing ? 'rgb(59, 130, 246)' : 'transparent', // 蓝色
            };
        }
    };

    // 获取内容区域样式
    const getContentStyle = (): React.CSSProperties => {
        if (isHorizontal) {
            return {
                width: `${size}px`,
                maxWidth: `${maxSize}px`,
                minWidth: `${minSize}px`,
            };
        } else {
            return {
                height: `${size}px`,
                maxHeight: `${maxSize}px`,
                minHeight: `${minSize}px`,
            };
        }
    };

    return (
        <Drawer
            direction={direction}
            open={open}
            onOpenChange={onOpenChange}
            repositionInputs={true}
            container={ctx.container}
        >
            <DrawerContent
                ref={drawerRef}
                className={cn(
                    "z-49 flex-1 absolute rounded-none overflow-hidden px-1",
                    vo.className
                )}
                style={getContentStyle()}
            >
                <div
                    style={getResizerStyle()}
                    onMouseDown={handleMouseDown}
                    className="hover:bg-primary/20 active:bg-primary/30"
                />

                <DrawerHeader className="flex flex-row p-1 justify-between">
                    <div className="p-2">
                        <DrawerTitle className="text-base font-semibold mb-4">
                            {vo.title}
                        </DrawerTitle>
                        <DrawerDescription>
                            {vo.desc && vo.desc}
                        </DrawerDescription>
                    </div>
                    <div>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon">
                                <RiCloseLine className="mr-0 h-4 w-4" />
                            </Button>
                        </DrawerClose>
                    </div>
                </DrawerHeader>

                <div className="flex-1 overflow-auto">
                    {vo.children&&vo.children.map((child, index) => (
                        child.object && ctx.buildViewObject({ id, ...props, vo: child, key: `child-${index}-${child.object}` })
                    ))}
                </div>

                <DrawerFooter />
            </DrawerContent>
        </Drawer>
    );
}
