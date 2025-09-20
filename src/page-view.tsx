import {NavPageLayout} from "@/layouts/nav-page-layout"
import {SubNavPageLayout} from "@/layouts/subnav-page-layout"
import {SelectNavPageLayout} from "@/layouts/select-nav-page-layout"
import { SidebarPageLayout } from "@/layouts/sidebar-page-layout"
import { SettingPageLayout } from "@/layouts/setting-page-layout"
import { DashboardPageLayout } from "@/layouts/dashboard-page-layout"
import { PanPageview } from "@/components/pan-page-view"
import IframeLayout from "@/layouts/iframe-layout"
import { MenuItem} from "@/types"


export function renderContent(basePath:string, item: MenuItem) {
    if (item.type === "page") {
        return (
            <div className="p-6">
                <h2 className="text-xl font-bold">{item.title} - Page</h2>
                <p className="mt-2 text-gray-500">这里是普通Page示例...</p>
            </div>
        )
    }

    if (item.type === "iframe" && item.url) {
        return <IframeLayout url={item.url} title={item.title || ""} />
    }

    if (item.type === "pan-page") {
        return <PanPageview id={item.id || ""} path={basePath} menu={item} />
    }

    if (item.type === "nav-page") {
        return <NavPageLayout id={item.id || ""} path={basePath} menu={item}/>
    }

    if (item.type === "subnav-page") {
        return <SubNavPageLayout id={item.id || ""} path={basePath} menu={item} />
    }

    if (item.type === "sidebar-page") {
        return <SidebarPageLayout id={item.id || ""} path={basePath} menu={item} />
    }

    if (item.type === "setting-page") {
        return <SettingPageLayout id={item.id || ""} path={basePath} menu={item} />
    }
    if (item.type === "dashboard-page") {
        return <DashboardPageLayout id={item.id || ""} path={basePath} menu={item} />
    }

    if (item.type === "select-nav-page") {
        return <SelectNavPageLayout id={item.id || ""} path={basePath} menu={item} />
    }

    // 如果没有匹配到，默认提示
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold">{item.title || "未命名菜单"}</h2>
            <p className="mt-2 text-gray-500">无匹配的菜单类型</p>
        </div>
    )
}


