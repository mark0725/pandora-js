import React, { useRef } from "react"
import { MenuItem, User, AppMenu, AppInfo } from "@/types"
import { UserMenu } from "@/components/user-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    RiListCheck,
    RiCloseLine,
} from "@remixicon/react"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLocation, useNavigate, useParams, Outlet } from "react-router-dom"
import { getIcon } from "@/components/icons/dynamic-icon"
import { useTranslation } from "react-i18next"


interface MainLayoutProps {
    app: AppInfo
    user: User
    menu: AppMenu
}

export function MainLayout(props: MainLayoutProps) {
    const { app, user, menu } = props
    const { t } = useTranslation()
    const navigate = useNavigate()
    const params = useParams<{ menuId?: string }>()
    const { menuId } = params
    const location = useLocation()
    const [open, setOpen] = React.useState(false);
    const mainRef = useRef(null);
    const navRef = useRef(null)
    // 将所有菜单合并，便于后续查找

    // 点击菜单时修改路由
    function handleMainMenuClick(item: MenuItem) {
        if (!item.id) {
            return
        }
        if (item.view === 'drawer') {
            setOpen(true)
            return
        }
        if (item.view === 'dialog') {
            setOpen(true)
            return
        }

        navigate(`/${item.id}`)
    }

    function renderMenuIcon(item: MenuItem) {
        if (item.ico) {
            const IconComp = getIcon(item.ico.replace(";", ""), 22) || (<RiListCheck size={22} />)
            return IconComp
        }
        const title = item.title?.trim() ?? ""
        // 如果含有中文，截取前2个字符；否则截取前4个字符
        if (/[^\x00-\xff]/.test(title)) {
            return (
                <span className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-slate-700 rounded">
                    {title.slice(0, 2)}
                </span>
            )
        } else {
            return (
                <span className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-slate-700 rounded">
                    {title.slice(0, 4)}
                </span>
            )
        }
    }

    return (
        <div className="w-full h-screen flex flex-row bg-white">
            {/* 左侧侧边栏 */}
            <aside ref={navRef} className="flex flex-col w-14 md:w-14 xl:w-16 bg-slate-900 text-white">
                {/* 顶部 LOGO */}
                <div className="h-16 flex items-center justify-center border-b border-slate-800">
                    <img src={app.logo} alt="logo" className="h-8 w-8 md:h-9 md:w-9 object-contain" />
                </div>

                {/* 主菜单 */}
                <div className="flex-1 flex flex-col items-center py-2">
                    {menu.main && menu.main.map((item) => {
                        const active = location.pathname.startsWith(`/${item.id}`)
                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleMainMenuClick(item)}
                                        className={
                                            "relative group flex flex-col items-center justify-center my-1.5 h-10 w-10 rounded hover:bg-slate-600 py-1 " +
                                            (active
                                                ? "bg-slate-700 after:content-[''] after:absolute after:w-0 after:h-0 after:border-y-7 after:border-y-transparent after:border-r-6 after:border-r-white after:right-[-12px] after:top-1/2 after:-translate-y-1/2"
                                                : "")
                                        }
                                    >
                                        {renderMenuIcon(item)}
                                        {item.title_short && (
                                            <span className="text-[10px] mt-1 leading-none">
                                                {item.title_short}
                                            </span>
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side={"right"}>{item.title}</TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>

                {/* 底部副菜单 + 用户菜单 */}
                <div className="flex flex-col items-center justify-center">
                    {menu.nav2 && menu.nav2.map((item) => {
                        const active = location.pathname.startsWith(`/${item.id}`)
                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        className={"relative group flex flex-col items-center justify-center my-1 h-10 w-10 rounded hover:bg-slate-600 py-1 " +
                                            (active
                                                ? "bg-slate-700 after:content-[''] after:absolute after:w-0 after:h-0 after:border-y-7 after:border-y-transparent after:border-r-6 after:border-r-white after:right-[-12px] after:top-1/2 after:-translate-y-1/2"
                                                : "")
                                        }
                                        onClick={() => handleMainMenuClick(item)}
                                        aria-label={t("layout.notifications")}
                                    >
                                        {renderMenuIcon(item)}
                                        {item.count && item.count > 0 && (
                                            <Badge className="absolute -top-1 left-full min-w-4 h-4 text-xxs bg-red-500 -translate-x-1/2 px-0.8">
                                                {item.count > 99 ? "99+" : item.count}
                                            </Badge>
                                        )}
                                        {item.title_short && (
                                            <span className="text-[10px] mt-1 leading-none">
                                                {item.title_short}
                                            </span>
                                        )}
                                    </button>

                                </TooltipTrigger>
                                <TooltipContent side={"right"}>{item.title}</TooltipContent>
                            </Tooltip>
                        )
                    })}
                    {
                        user && (<div className="p-2">
                            <UserMenu userName={user.name} userMail={user.mail} avatar={user.avatar} userItems={menu.navuser} />
                        </div>)
                    }

                </div>
            </aside>
            <main ref={mainRef} className="relative flex flex-1 h-full w-full min-h-0 bg-gray-50  overflow-hidden">
                <Drawer
                    direction="left"
                    open={open}
                    onOpenChange={setOpen}
                    container={mainRef.current}
                    repositionInputs={true}
                >
                    <DrawerContent className="z-49 flex-1 absolute h-full rounded-none overflow-hidden">
                        <DrawerHeader className="flex flex-row p-1 justify-between">
                            <div className="p-2">
                                <DrawerTitle>{t("layout.drawer.title")}</DrawerTitle>
                                <DrawerDescription>{t("layout.drawer.subtitle")}</DrawerDescription>
                            </div>
                            <div>
                                <DrawerClose asChild>
                                    <Button variant="ghost" size="icon"><RiCloseLine className="mr-0 h-4 w-4" /></Button>
                                </DrawerClose>
                            </div>

                        </DrawerHeader>
                        <DrawerFooter>
                            <Button>{t("layout.drawer.confirm")}</Button>

                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
                <div className="flex-1 h-full w-full overflow-hidden">
                    <Outlet />
                </div>

            </main>
        </div>
    )
}