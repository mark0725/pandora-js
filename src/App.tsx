import * as React from 'react'
import { fetchAppConfig } from '@/api/app'
import { MainLayout } from '@/layouts/main-layout'
import { AppConfig, User } from '@/types'
import { Routes, Route, Navigate } from "react-router-dom"
import { Loadding } from "@/components/page-loadding"
import { renderContent } from "@/page-view"
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes'
import { useTheme } from 'next-themes'
import { AlertCircle } from "lucide-react"
import { LoginPage } from "@/pages/auth/login"
import { useAuthStore } from "@/store"
import { I18nextProvider } from 'react-i18next';
import { i18n, initI18nWithBackend } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { init } from 'echarts'

export default function App() {
    const [config, setConfig] = React.useState<AppConfig | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string>('')
    const { theme, setTheme } = useTheme()
    const authed = useAuthStore(s => s.authed)

    setTheme('light')
    const { t } = useTranslation();

    async function loadData() {
        try {
            const data = await fetchAppConfig()
            setConfig(data)
            await initI18nWithBackend({
                //namespaces: ['common', 'app', 'menu'],
                //defaultNS: 'base',
                // authToken: data.auth.token,
                // baseUrl: data.auth.baseUrl,
                debug: true
            })
            setLoading(false)
            document.title = data.app.title;
        } catch (e) {
            console.error(e)
            setError(t('app.configLoadFailed'))
            setLoading(false)
        }
    }
    React.useEffect(() => {
        setLoading(true)
        void loadData()
    }, [authed])

    if (loading) {
        return (<Loadding />)
    }

    if (error || !config) {
        return (<div className="flex h-full flex-1 p-4 items-center justify-center">
            <Alert variant="destructive" className="w-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription> {error || t('common.loadFailed')} </AlertDescription>
            </Alert>
        </div>)
    }

    const allMenus = [...config.menu.main]
    if (config.menu.nav2) {
        allMenus.push(...config.menu.nav2)
    }

    if (config.auth) {
        const { authed, auth_type, signin_url } = config.auth;

        // 2. 计算当前页面和登陆页的 pathname
        const currentPath = window.location.pathname;
        const signinPath = new URL(signin_url, window.location.origin).pathname;
        console.log('currentPath', currentPath)
        console.log('signinPath', signinPath)
        // 3. 未登录 && 不在登陆页 => 跳转
        // if (!authed && currentPath !== signinPath) {
        //     window.location.replace(signin_url);
        // }
        if (!authed && auth_type == 'sso') {
            window.location.replace(signin_url);
        }
    }

    return (
        <I18nextProvider i18n={i18n}>
            <ThemeProvider attribute="class">
                <Toaster />
                {loading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <Loadding />
                    </div>
                )}
                {config.auth && !config.auth.authed ? (<LoginPage appConfig={config} />) :
                    (<Routes>
                        {/* <Route path="/auth/login" element={<LoginPage />} /> */}
                        <Route
                            path="/"
                            element={
                                <MainLayout
                                    app={config.app}
                                    user={config.user}
                                    menu={config.menu}

                                />
                            }
                        >
                            {/* 默认进入时跳转到 /home */}
                            <Route index element={<Navigate to="/home" replace />} />

                            {allMenus.map((item) => (<Route key={item.id} path={item.id + "/*"} element={renderContent(`/${item.id}`, item)} />))}

                            {config.menu.navuser && (
                                <Route path={`user/*`} element={renderContent(`/user`, {
                                    type: 'setting-page',
                                    id: 'user',
                                    title: t('user.center'),
                                })}>
                                </Route>
                            )}

                            {/* <Route path="*" element={<Navigate to="/home" replace />} /> */}
                        </Route>
                    </Routes>)}
            </ThemeProvider>
        </I18nextProvider>
    )
}