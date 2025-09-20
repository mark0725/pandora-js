import * as React from 'react'
import { fetchAppConfig } from '@/api/app'
import { MainLayout } from '@/layouts/main-layout'
import { AppConfig, User } from '@/types'
import { Routes, Route, Navigate } from "react-router-dom"
import {Loadding} from "@/components/page-loadding"
import { renderContent } from "@/page-view"
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes'
import { useTheme } from 'next-themes'
import { AlertCircle } from "lucide-react"

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

export default function App() {
    const [config, setConfig] = React.useState<AppConfig | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string>('')
    const { theme, setTheme } = useTheme()
    setTheme('light')
    React.useEffect(() => {
        fetchAppConfig()
            .then((data) => {
                setConfig(data)
                setLoading(false)
                document.title = data.app.title;
            })
            .catch((e) => {
                console.error(e)
                setError('Loading app config failed')
                setLoading(false)
            })
    }, [])

    if (loading) {
        return ( <Loadding/> )
    }

    
    if (error || !config) {
        return (<div className="flex h-full flex-1 p-4 items-center justify-center">
            <Alert variant="destructive" className="w-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription> {error || 'Loaded failed'} </AlertDescription>
            </Alert>
        </div>)
    }

    const allMenus = [...config.menu.main, ...config.menu.nav2]

    return (
        <>
            <ThemeProvider attribute="class">
            <Toaster />
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Loadding />
                </div>
            )}
            <Routes>
                
                <Route
                    path="/"
                    element={
                        <MainLayout
                            logo={config.app.logo}
                            appName={config.app.name}
                            user={config.user}
                            mainMenu={config.menu.main}
                            nav2Menu={config.menu.nav2}
                            userMenu={config.menu.navuser}
                        />
                    }
                >
                    {/* 默认进入时跳转到 /home */}
                    <Route index element={<Navigate to="/home" replace />} />

                    {allMenus.map((item) => ( <Route key={item.id} path={item.id+"/*"} element={renderContent(`/${item.id}`, item)}/> ))}

                    {config.menu.navuser&&(
                        <Route path={`user/*`} element={renderContent(`/user`, {
                            type: 'setting-page',
                            id: 'user',
                            title: '用户中心',
                        })}>
                            {/* {config.menu.navuser.map((item) => (
                                <Route key={item.id} path={`user/${item.id}`} element={renderContent(`/user`, item)}/>
                            ))} */}
                        </Route>
                    )}

                    {/* <Route path="*" element={<Navigate to="/home" replace />} /> */}
                </Route>
            </Routes>
            </ThemeProvider>
        </>
    )
}