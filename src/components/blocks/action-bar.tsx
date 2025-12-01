"use client"
import React, { useEffect, useState, useCallback, useContext } from 'react'
import { MoreHorizontalIcon, } from "lucide-react"
import { RiAddLine } from '@remixicon/react'
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ViewComponentProps } from './types'
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { handleOperation } from "@/components/action"
import { useParams } from "react-router-dom";

export function ActionBar({ id, vo, dataTables, operations }: ViewComponentProps &React.ComponentProps<"div">) {
    const ctx = useContext(PageModelContext);
    const pageViewCtx = useContext(PageViewContext);
    if (!ctx) throw new Error("must be used within PageModelProvider");
    if (!pageViewCtx) throw new Error("must be used within PageViewProvider");

    const urlParams = useParams();
    const urlVars: Record<string, string> = {}
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });

    const mainActions = (vo.actions?.children || []).map((act: any) => {
        const oper = operations[act.id] ? { ...operations[act.id], ...act } : act
        return (
            <Button
                key={act.id}
                variant={
                    oper.level === 'primary' ? 'default' : oper.level === 'danger' ? 'destructive' : 'outline'
                }
                className="text-sm font-sm rounded-sm"
                onClick={async () => {
                    await handleOperation({ oper, ctx, urlVars });
                }
                }
            >
                {oper.icon === 'FfPlus' ? <RiAddLine className="mr-0 h-4 w-4" /> : null}
                {oper.label}
            </Button>
        )
    })

    const moreActions = (vo.actionMore?.children || []).map((act: any) => {
        const oper = operations[act.id] ? { ...operations[act.id], ...act } : act
        return (<DropdownMenuItem
            key={act.id}
            className="w-full justify-start text-sm"
            onClick={async () => {
                await handleOperation({ oper, ctx, urlVars })
            }}
        >
            {oper.label}
        </DropdownMenuItem>)
    })

    return (
        <ButtonGroup>
            <ButtonGroup>
                {mainActions}
            </ButtonGroup>
           
            {moreActions.length > 0 && (
                <div className="relative">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="text-sm font-sm rounded-sm" aria-label="More Options"> 
                                <MoreHorizontalIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent sideOffset={0} align="end" className="w-40 p-2">
                            {moreActions}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </ButtonGroup>
    )
}
