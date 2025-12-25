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
import type { MenuItem, PageLayoutConfig } from "@/types"
import { Loadding } from "@/components/page-loadding"
import { getIcon } from "@/components/icons/dynamic-icon"
import { renderContent } from "@/page-view"
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/registry/default/ui/navigation-menu"

interface SubNavPageLayoutProps {
    id: string
    key?: string
    path: string
    menu: MenuItem
}

export function SubNavPageLayout(props: SubNavPageLayoutProps) {
    const { id, path } = props
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
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
    function handleSelect(menuId?: string) {
        if (!menuId) return
        navigate(`${path}/${menuId}`)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex h-10 bg-gray-200/60 w-full item-center justify-center shadow-md">
                <NavigationMenu className="max-md:hidden">
                    <NavigationMenuList className="gap-2">
                        {config?.menu?.map((m: MenuItem) => {
                            const targetPath = `${path}/${m.id}`
                            const isActive = location.pathname.startsWith(targetPath)
                            return (
                                <NavigationMenuItem key={m.id}>
                                    <NavigationMenuLink
                                        active={isActive}
                                        onClick={() => handleSelect(m.id)}
                                        className="text-foreground hover:text-primary flex-row items-center gap-2 py-1.5 font-base"
                                    >
                                        {m.ico && getIcon(m.ico)}
                                        <span>{m.title}</span>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            )
                        })}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>

            <div className="h-full flex-1 p-1 relative mb-0 overflow-hidden">
                <Routes>
                    <Route index element={<Navigate to="home" replace />} />
                    {config?.menu?.map((item: MenuItem) => (
                        <Route key={`${id}:${item.id}`} path={item.id} element={renderContent(`${path}/${item.id}`, item)} />
                    ))}
                </Routes>
            </div>
        </div>
    )
}