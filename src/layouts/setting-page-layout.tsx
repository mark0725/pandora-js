import React, { useEffect, useState } from "react"
import {
    useNavigate,
    Routes,
    Route,
    Navigate,
    useLocation
} from "react-router-dom"
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
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { MenuItem, PageLayoutConfig } from "@/types"
import { Loadding } from "@/components/page-loadding"
import { renderContent } from "@/page-view"
import { getIcon } from "@/components/icons/dynamic-icon"



interface SettingLayoutProps {
    id: string
    key?: string
    path: string
    menu: MenuItem
}

export function SettingPageLayout(props: SettingLayoutProps) {
    const { id, path } = props
    const navigate = useNavigate()
    const location = useLocation()
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
            setError('加载配置信息失败')
            setLoading(false)
        })
    }, [id])

    if (loading) {
        return (<Loadding />)
    }

    if (error || !config) {
        return <div className="p-4 text-red-500">{error || '页面加载失败'}</div>
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
                <Sidebar className="relative">
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
                                            <SidebarGroup>

                                                <SidebarGroupLabel className="flex justify-between h-full py-2 text-sm [&[data-state=open]>svg]:rotate-180 w-full">
                                                    {m.ico&&getIcon(m.ico)}
                                                    {m.title}
                                                </SidebarGroupLabel>
                                                <SidebarGroupContent>
                                                    <SidebarMenu className="p-0">
                                                        {m.children.map((submenu: MenuItem) => {
                                                            const isActive = location.pathname.startsWith(targetPath + "/" + submenu.id)
                                                            return (
                                                                <SidebarMenuItem key={`${id}:${m.id}:${submenu.id}`} className={`h-8 ${isActive ? "bg-blue-100 /50 border-r-2 border-blue-600 text-blue-600 rounded-none" : "border-r-2 border-transparent text-gray-600 hover:bg-gray-100 rounded-none"}`}>
                                                                    <button
                                                                        key={`${id}:${m.id}:${submenu.id}`}
                                                                        onClick={() => handleSelect(m.id, submenu.id)}
                                                                        className={`relative inline-flex items-center w-full h-full px-4 text-sm`}>
                                                                        {submenu.ico&&getIcon(submenu.ico)}
                                                                        {submenu.title}
                                                                    </button>
                                                                </SidebarMenuItem>
                                                            )

                                                        })}

                                                    </SidebarMenu>
                                                </SidebarGroupContent>
                                            </SidebarGroup>
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
                                                {m.ico&&getIcon(m.ico)}
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
                                    <Route path={`${item.id}/*`}>
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