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
import { renderContent } from "@/page-view"
import { getIcon } from "@/components/icons/dynamic-icon"

interface NavPageLayoutProps {
    id: string
    key?: string
    path: string
    menu: MenuItem
}

export function NavPageLayout(props: NavPageLayoutProps) {
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

    function handleSelect(menuId?: string) {
        if (!menuId) return
        navigate(`${path}/${menuId}`)
    }

    return (
        <div className="flex flex-col h-full">
            <nav className="flex items-center bg-white px-4 h-10 shadow-md">
                <div className="text-base text-gray-800">
                    {config?.title || ""}
                </div>
                <div className="border-l h-6 mx-3" />
                <div className="flex space-x-1 h-10">
                    {config?.menu?.map((m: MenuItem) => {
                        const targetPath = `${path}/${m.id}`
                        const isActive = location.pathname.startsWith(targetPath)

                        return (
                            <button
                                key={`${id}:${m.id}`}
                                onClick={() => handleSelect(m.id)}
                                className={`relative inline-flex items-center h-full px-4 text-sm ${isActive
                                    ? "bg-blue-100/50 border-b-2 border-blue-600 text-blue-600"
                                    : "border-b-2 border-transparent text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {m.ico && getIcon(m.ico)}
                                {m.title}
                            </button>
                        )
                    })}
                </div>
            </nav>
            <div className="h-full flex-1 p-1 relative mb-0 overflow-hidden">
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
        </div>
    )
}