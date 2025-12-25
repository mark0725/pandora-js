import React, { useEffect, useState } from "react"
import {
    useNavigate,
    Routes,
    Route,
    Navigate,
    useLocation
} from "react-router-dom"
import { useTranslation } from "react-i18next"
import { fetchPageLayoutConfig } from "@/api/app"
import {
    SidebarProvider,
    SidebarTrigger,
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { ChevronDownIcon, } from "lucide-react"
import type { MenuItem, PageLayoutConfig } from "@/types"
import { Loadding } from "@/components/page-loadding"
import { renderContent } from "@/page-view"
import { getIcon } from "@/components/icons/dynamic-icon"

interface SidebarLayoutProps {
    id: string
    key?: string
    path: string
    menu: MenuItem
}

export function SidebarPageLayout(props: SidebarLayoutProps) {
    const { id, path } = props
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useTranslation()
    // const routeParams = useParams() // 这里可以获取路由参数
    const [config, setConfig] = useState<PageLayoutConfig>()
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string>('')


    useEffect(() => {
        setLoading(true)
        fetchPageLayoutConfig(id).then((data) => {
            setConfig(data)
            setLoading(false)
        }).catch((e) => {
            console.error(e)
            setError(t('app.configLoadFailed'))
            setLoading(false)
        })
    }, [id, t])

    if (loading) {
        return (<Loadding />)
    }

    if (error || !config) {
        return <div className="p-4 text-red-500">{error || t('app.pageLoadFailed')}</div>
    }

    // 点击二级菜单时，若存在下拉参数则插入到路径里
    function handleSelect(menuId?: string, subMenuId?: string) {
        if (!menuId) return
        if (subMenuId) {
            navigate(`${path}/${menuId}/${subMenuId}`)
        } else {
            navigate(`${path}/${menuId}`)
        }
    }

    // 渲染下拉选择器


    return (

        <div className="flex h-full">
            <SidebarProvider defaultOpen={true}>
                <Sidebar className="relative w-60">
                    <SidebarHeader className="text-center">
                        {config?.title || ""}
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            {config?.menu?.map((m: MenuItem) => {
                                const targetPath = `${path}/${m.id}`
                                console.log("targetPath", targetPath)
                                const isActive = location.pathname.startsWith(targetPath)
                                if (m.children && m.children?.length > 0) {
                                    return (
                                        <Collapsible key={`${id}:${m.id}`} defaultOpen={isActive} className="group/collapsible">
                                            <SidebarMenuItem>

                                                <CollapsibleTrigger className="flex justify-between h-full px-4 py-2 text-sm [&[data-state=open]>svg]:rotate-180 w-full">
                                                    <div className="flex-1 text-left h-full text-sm inline-flex items-center ">
                                                        {m.ico && getIcon(m.ico)}
                                                        {m.title}
                                                    </div>
                                                    <ChevronDownIcon
                                                        size={16}
                                                        className="mt-1 shrink-0 opacity-60 transition-transform duration-200"
                                                        aria-hidden="true"
                                                    />

                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub className="p-0">
                                                        {m.children.map((submenu: MenuItem) => {
                                                            const isActive = location.pathname.startsWith(targetPath + "/" + submenu.id)
                                                            return (
                                                                <SidebarMenuSubItem key={`${id}:${m.id}:${submenu.id}`} className={`h-8 ${isActive ? "bg-blue-100 /50 border-r-2 border-blue-600 text-blue-600 rounded-none" : "border-r-2 border-transparent text-gray-600 hover:bg-gray-100 rounded-none"}`}>
                                                                    <button onClick={() => handleSelect(m.id, submenu.id)}
                                                                        className={`relative inline-flex items-center w-full h-full px-4 text-sm`}>
                                                                        {submenu.ico && getIcon(submenu.ico)}
                                                                        {submenu.title}
                                                                    </button>
                                                                </SidebarMenuSubItem>
                                                            )

                                                        })}

                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    )
                                }


                                return (
                                    <SidebarMenuItem key={`${id}:${m.id}`}>
                                        <SidebarMenuButton asChild>
                                            <button
                                                key={`${id}:${m.id}`}
                                                onClick={() => handleSelect(m.id)}
                                                className={`relative inline-flex items-center h-full px-4 text-sm ${isActive
                                                    ? "bg-blue-100/50 border-r-2 border-blue-600 text-blue-600 rounded-none"
                                                    : "border-r-2 border-transparent text-gray-600 hover:bg-gray-100 rounded-none"
                                                    }`}
                                            >
                                                {m.ico && getIcon(m.ico)}
                                                {m.title}
                                            </button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                )
                            })}
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter />
                </Sidebar>
                <div className="h-full flex-1 p-1 relative mb-0 overflow-hidden">
                    {/* <SidebarTrigger /> */}
                    <Routes>
                        <Route index element={<Navigate to="home" replace />} />
                        {config?.menu?.map((item: MenuItem) => {
                            if (item.children && item.children?.length > 0) {
                                return (
                                    <Route path={`${item.id}/*`} element={renderContent(`${path}/${item.id}`, item)} >
                                        {item.children?.map((subitem: MenuItem) => (
                                            <Route key={`${id}:${item.id}:${subitem.id}`} path={subitem.id} element={renderContent(`${path}/${item.id}/${subitem.id}`, subitem)} />
                                        ))}
                                    </Route>
                                )
                            } else {
                                return <Route key={`${id}:${item.id}`} path={item.id} element={renderContent(`${path}/${item.id}`, item)} />
                            }
                        })}
                    </Routes>
                </div>
            </SidebarProvider>
        </div>
    )
}