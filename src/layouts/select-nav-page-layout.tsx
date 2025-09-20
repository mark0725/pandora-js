import React, { useEffect, useState } from "react"
import {
    useNavigate,
    Routes,
    Route,
    Navigate,
    useLocation
} from "react-router-dom"
import { fetchPageLayoutConfig } from "@/api/app"
import type { MenuItem, PageLayoutConfig } from "@/types"
import { getIcon } from "@/components/icons/dynamic-icon"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loadding } from "@/components/page-loadding"
import { renderContent } from "@/page-view"

interface NavPageLayoutProps {
    id: string
    key?: string
    path: string
    menu: MenuItem
}

export function SelectNavPageLayout(props: NavPageLayoutProps) {
    const { id, path } = props
    const navigate = useNavigate()
    const location = useLocation()
    // const routeParams = useParams() // 这里可以获取路由参数
    const [config, setConfig] = useState<PageLayoutConfig>()
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string>('')
    // 当前路径下的下拉选项值，如 /nav-page/:paramValue/...
    const paramValue = location.pathname.substring(path.length + 1).split("/")[0] 


    // 根据 id 和 paramValue 重新加载页面配置信息
    useEffect(() => {
        if (!id) return
        setLoading(true)
        let params = {}
        if (config?.select) {
            params = {
                [config.select.param]: paramValue
            }
        }
        fetchPageLayoutConfig(id, params)
            .then((data) => {
                setConfig(data)
                setLoading(false)
            })
            .catch((e) => {
                console.error(e)
                setError('加载配置信息失败')
                setLoading(false)
            })
    }, [id, paramValue])


    if (loading) {
        return ( <Loadding/> )
    }

    if (error || !config) {
        return <div className="p-4 text-red-500">{error || '页面加载失败'}</div>
    }

    function getParamValue() {
        const seg = location.pathname.substring(path.length + 1).split("/")[0]
        if (!seg && config?.select) {
            return config.select.value
        }
        return seg
    }
    // 点击二级菜单时，若存在下拉参数则插入到路径里
    function handleSelect(menuId?: string) {
        if (!menuId) return
        if (config?.select) {
            const paramValue = getParamValue()
            navigate(`${path}/${paramValue}/${menuId}`)
        } else {
            navigate(`${path}/${menuId}`)
        }
    }

    // 渲染下拉选择器
    function renderSelect() {
        if (!config?.select) return null
        
        const paramValue = getParamValue()
        console.log("paramValue:", paramValue)
        return (
            <Select
                value={paramValue}
                onValueChange={(val: string) => {
                    navigate(`${path}/${val}`)
                }}
            >
                <SelectTrigger className="h-8 min-w-[100px] max-w-[120px] text-sm text-center text-gray-600 border-0 shadow-none focus:ring-0 focus:outline-non hover:bg-gray-100 mr-2">
                    <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                {config.select.items.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
                </SelectContent>
            </Select>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <nav className="flex items-center bg-white px-4 h-10 shadow-md">
                <div className="text-base text-gray-800">
                    {config?.title || ""}
                </div>
                <div className="border-l h-6 mx-3" />
                {renderSelect()}
                <div className="flex space-x-1 h-10">
                    {config?.menu?.map((m: MenuItem) => {
                        const paramValue = getParamValue()
                        const targetPath = `${path}/${paramValue}/${m.id}`
                        console.log("targetPath", targetPath)

                        const isActive = location.pathname.startsWith(targetPath)

                        return (
                            <button
                                key={targetPath}
                                onClick={() => handleSelect(m.id)}
                                className={`relative inline-flex items-center h-full px-4 text-sm ${isActive
                                        ? "bg-blue-100/50 border-b-2 border-blue-600 text-blue-600"
                                        : "border-b-2 border-transparent text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {m.ico&&getIcon(m.ico)}
                                {m.title}
                            </button>
                        )
                    })}
                </div>
            </nav>
            {/* 子路由内容出口 */}
            <div className="flex-1 h-full  p-1 relative mb-0 overflow-hidden">
                <Routes>
                    <Route index element={<Navigate to={config?.select?.value|| "default"} replace />} />
                    <Route path={`:${config?.select?.param|| "id"}/*`}>
                        <Route index element={ <Navigate to={config.menu?.[0]?.id || "home"} replace /> } />
                        {config.menu?.map((item: MenuItem) => (
                            <Route key={`${id}:${item.id}`} path={item.id} element={renderContent(`${path}/${getParamValue()}/${item.id}`, item)} />
                        ))}
                    </Route>
                </Routes>
            </div>
        </div>
    )
}