export type User = {
    id: string
    name: string
    dept: string
    mail: string
    avatar: string
}

export type UserAuth = {
    authed: boolean;
    auth_type: string;
    auth_url: string;
    signin_url: string;
    signout_url: string;
};

export type AppMenu = {
    main: MenuItem[]
    nav2: MenuItem[]
    navuser: MenuItem[]
}

export type AppInfo = {
    name: string
    version: string
    logo: string
    title: string
}

export interface AppConfig {
    app: AppInfo
    auth: UserAuth
    user: User
    menu: AppMenu
}

export interface PageLayoutConfig {
    title?: string
    type?: 'page' | 'iframe' | 'nav-page' | 'link' | 'user' | 'pan-page' | 'sidebar-page' | 'setting-page' | 'dashboard-page' |'subnav-page'
    select?: MenuSelect
    menu: MenuItem[]
}

export interface MenuItem {
    id?: string
    type: 'page' | 'iframe' | 'nav-page' | 'link' | 'user' | 'select-nav-page' | 'pan-page' | 'sidebar-page' | 'setting-page' | 'separator' | 'dashboard-page' |'subnav-page'
    view?: 'page'|'dialog'|'drawer'
    count?: number
    title?: string
    title_short?: string
    url?: string
    ico?: string
    children?: MenuItem[]
}

export interface MenuSelect {
    label: string
    value: string
    param: string
    items: MenuSelectItem[]
}

export interface MenuSelectItem {
    label: string
    value: string
}

export type DictItem = {
    value: string;
    label: string;
    icon?: string;
    style?: string;
    color?: string;
    fields?: Record<string, any>;
}

export type Dict = {
    id?: string;
    name?: string;
    type?: string;
    struct?: string; // options, tree, table
    style?: string;
    items: { [key: string]: DictItem };
    options?: DictItem[];
};

export interface MappingDict {
    [key: string]: Dict
}

export interface DataField {
    id: string
    label: string
    component: string
    isFilter?: boolean
    required?: boolean
    source?: string
    clearable?: boolean
    searchable?: boolean
    defaultValue?: string
    format?: string
    inputFormat?: string
    multiple?: boolean
    disabled?: boolean
    effectMap?: Record<string, string>
    selectFilterBy?: string
}

export interface DataTable {
    id: string
    label: string
    mappingApi: string
    fields: DataField[]
}

export interface DataObject  {
    id: string;
    type?: string;
    description?: string;
    api?: string;
    load?: string;
    cache?: string;
    dataTable?: string;
};

export interface Operation {
    id: string
    actionType: string
    type: string
    label: string
    title?: string
    view?: string
    confirm?: string
    api?: string
    method?: string
    feature?: string
    icon?: string
    level?: string
    accept?: string
    effects?: string
}

export interface ViewObject {
    object: string
    className?: string
    children?: ViewObject[]
    [key: string]: any 
}

export interface PageView {
    [key: string]: ViewObject
}

export interface PageModel {
    dataSet: Record<string, DataTable>
    operations: Record<string, Operation>
    dataStore: Record<string, DataObject>
    pageView: PageView
    mainView: string
}
