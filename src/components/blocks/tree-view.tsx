"use client"
import { useCallback, useEffect, useState, useContext, useRef, useMemo } from 'react'
import { ViewComponentProps } from './types'
import { MappingDict, DataField } from '@/types'
import { fetchPageMapping } from "@/api/page"
import { apiGet } from "@/api/app"
import { cn } from '@/lib/utils'
import { useParams } from "react-router-dom";
import { useStore } from 'zustand'
import { toast } from 'sonner'
import { PageModelContext, PageViewContext } from "@/context/page-context"
import { handleOperation } from "@/components/action"
import {
    expandAllFeature,
    checkboxesFeature,
    hotkeysCoreFeature,
    searchFeature,
    selectionFeature,
    syncDataLoaderFeature,
    TreeState,
    ItemInstance,
    FeatureImplementation,
    TreeConfig,
    createTree,
} from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import {
    FileIcon,
    CircleXIcon,
    FilterIcon,
    FolderIcon,
    FolderOpenIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tree, TreeItem, TreeItemLabel } from "@/components/ui/tree"
import { Loadding } from "@/components/page-loadding"

interface Item {
    name: string
    children?: string[]
    data?: Record<string, any> // 添加原始数据字段
}

type TreeViewConfig = {
    rowKey?: string,
    parentField?: string,
    labelField?: string
};

function convertToTree(data: any[], config: TreeViewConfig): [string[], Record<string, Item>] {
    const items: Record<string, Item> = {};
    const rowKey = config.rowKey || 'id';
    const parentField = config.parentField || 'parentId';
    const labelField = config.labelField || 'name';

    data.forEach(record => {
        const key = String(record[rowKey]);
        const name = record[labelField] || '';
        items[key] = {
            name: name,
            children: [],
            data: record // 保存原始数据
        };
    });

    let topKeys: string[] = [];

    data.forEach(record => {
        const key = String(record[rowKey]);
        const parentKey = record[parentField] ? String(record[parentField]) : null;

        if (!parentKey || parentKey === 'root') {
            topKeys.push(key);
            return;
        }

        if (parentKey && items[parentKey]) {
            if (!items[parentKey].children) {
                items[parentKey].children = [];
            }
            items[parentKey].children!.push(key);
        }
    });

    items["root"] = {
        name: 'root',
        children: topKeys
    };

    return [topKeys, items];
}

export function TreeView({ id, vo, dataTables, operations }: ViewComponentProps) {
    const ctx = useContext(PageModelContext);
    const pageViewCtx = useContext(PageViewContext);
    if (!ctx) throw new Error("must be used within PageModelProvider");
    if (!pageViewCtx) throw new Error("must be used within PageViewProvider");

    const [loading, setLoading] = useState(true)
    const [mappingDict, setMappingDict] = useState<MappingDict>()
    const dataTableId = vo.dataTable
    const apiUrl = vo.api
    const rowKey = vo.rowKey || 'id'
    const dataTable = dataTables[dataTableId]

    let defaultValues: Record<string, any> = {}
    if (vo.mode === 'edit') {
        defaultValues = ctx ? ctx?.record || {} : {}
    }

    const urlVars: Record<string, string> = {}
    const urlParams = useParams();
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });

    const [itemsData, setItems] = useState<Record<string, Item>>({
        root: {
            name: 'root',
            children: []
        }
    })

    const indent = 20
    const [initialExpandedItems, setInitialExpandedItems] = useState<string[]>(["root"])
    const [state, setState] = useState<Partial<TreeState<Item>>>({})
    const [searchValue, setSearchValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const dataLoader = useMemo(() => ({
        getItem: (itemId: string) => {
            const item = itemsData[itemId]
            return item || null
        },
        getChildren: (itemId: string) => {
            const item = itemsData[itemId]
            const children = item?.children ?? []
            return children
        },
    }), [itemsData])

   
    const clickFeature: FeatureImplementation = {
        itemInstance: {
            getProps: ({ tree, item, prev }) => ({
                ...prev?.(),
               
                onClick: (e: React.MouseEvent) => {
                    if (item.isFolder()) {
                        return
                    }

                    if (!vo.onClick) {
                        return
                    }

                    const oper = operations[vo.onClick]
                    if (!oper) {
                        toast.error('No operation found for id: ' + vo.onClick)
                        return
                    }

                    const itemData = item.getItemData()
                    const originalData = itemData?.data // 获取原始数据
                    if (!originalData) {
                        console.warn('No data found for item:', item.getId())
                        return
                    }
                    console.log('originalData:', originalData)
                    handleOperation({ oper, ctx, urlVars, record: originalData });
                },
            }),
        },
    }
    const tree = useTree<Item>({
        state,
        setState,
        initialState: {
            expandedItems: initialExpandedItems,
        },
        indent,
        rootItemId: "root",
        getItemName: (item: ItemInstance<Item>) => {
            const data = item.getItemData()
            return data?.name || ''
        },
        isItemFolder: (item: ItemInstance<Item>) => {
            const children = item.getChildren()
            return children.length > 0
        },
        dataLoader,
        features: [
            syncDataLoaderFeature,
            hotkeysCoreFeature,
            selectionFeature,
            searchFeature,
            expandAllFeature,
            clickFeature,
        ],
    })

    async function loadData() {
        setLoading(true)
        try {
            const params = new URLSearchParams(window.location.search)
            if (apiUrl) {
                const result = await apiGet(apiUrl, params)
                if (result?.length) {
                    const [topItems, newItems] = convertToTree(result, {
                        rowKey: vo.rowKey,
                        parentField: vo.parentField,
                        labelField: vo.labelField
                    })
                    setItems(newItems)
                    setInitialExpandedItems(topItems)
                    setState({
                        expandedItems: topItems
                    })
                }
            }
            if (dataTable?.mappingApi) {
                const mappingData = await fetchPageMapping(id, dataTable.mappingApi, params, urlVars)
                setMappingDict(mappingData || {})
            }
        } catch (error) {
            console.error('Failed to load tree data:', error)
            toast.error('加载树形数据失败')
            setItems({
                root: {
                    name: 'root',
                    children: []
                }
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadData()
    }, [apiUrl, id])

    useEffect(() => {
        if (Object.keys(itemsData).length > 1) {
            tree.rebuildTree()
        }
    }, [tree, itemsData])

    const handleClearSearch = () => {
        setSearchValue("")
        const searchProps = tree.getSearchInputElementProps()
        if (searchProps.onChange) {
            const syntheticEvent = {
                target: { value: "" },
            } as React.ChangeEvent<HTMLInputElement>
            searchProps.onChange(syntheticEvent)
        }
        setState((prevState) => ({
            ...prevState,
            expandedItems: initialExpandedItems,
        }))
        setFilteredItems([])
        if (inputRef.current) {
            inputRef.current.focus()
            inputRef.current.value = ""
        }
    }

    const [filteredItems, setFilteredItems] = useState<string[]>([])

    const shouldShowItem = (itemId: string) => {
        if (!searchValue || searchValue.length === 0) return true
        return filteredItems.includes(itemId)
    }

    useEffect(() => {
        if (Object.keys(itemsData).length <= 1) return

        if (!searchValue || searchValue.length === 0) {
            setFilteredItems([])
            return
        }

        const allItems = tree.getItems()

        const directMatches = allItems
            .filter((item) => {
                const name = item.getItemName().toLowerCase()
                return name.includes(searchValue.toLowerCase())
            })
            .map((item) => item.getId())

        const parentIds = new Set<string>()
        directMatches.forEach((matchId) => {
            let item = tree.getItems().find((i) => i.getId() === matchId)
            while (item?.getParent && item.getParent()) {
                const parent = item.getParent()
                if (parent) {
                    parentIds.add(parent.getId())
                    item = parent
                } else {
                    break
                }
            }
        })

        const childrenIds = new Set<string>()
        directMatches.forEach((matchId) => {
            const item = tree.getItems().find((i) => i.getId() === matchId)
            if (item && item.isFolder()) {
                const getDescendants = (itemId: string) => {
                    const children = itemsData[itemId]?.children || []
                    children.forEach((childId) => {
                        childrenIds.add(childId)
                        if (itemsData[childId]?.children?.length) {
                            getDescendants(childId)
                        }
                    })
                }
                getDescendants(item.getId())
            }
        })

        setFilteredItems([
            ...directMatches,
            ...Array.from(parentIds),
            ...Array.from(childrenIds),
        ])

        const currentExpandedItems = tree.getState().expandedItems || []
        const folderIdsToExpand = allItems.filter((item) => item.isFolder()).map((item) => item.getId())

        setState((prevState) => ({
            ...prevState,
            expandedItems: [
                ...new Set([...currentExpandedItems, ...folderIdsToExpand]),
            ],
        }))
    }, [searchValue, tree, itemsData])


    if (loading) {
        return <Loadding />
    }

    const hasData = Object.keys(itemsData).length > 1 || (itemsData.root?.children?.length ?? 0) > 0
    if (!hasData) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">暂无数据</div>
    }

    const treeItems = tree.getItems()

    return (
        <div className="flex h-full flex-col gap-2 *:nth-2:grow">
            <div className="relative pr-1">
                <Input
                    ref={inputRef}
                    className="peer ps-9"
                    value={searchValue}
                    onChange={(e) => {
                        const value = e.target.value
                        setSearchValue(value)

                        const searchProps = tree.getSearchInputElementProps()
                        if (searchProps.onChange) {
                            searchProps.onChange(e)
                        }

                        if (value.length > 0) {
                            tree.expandAll()
                        } else {
                            setState((prevState) => ({
                                ...prevState,
                                expandedItems: initialExpandedItems,
                            }))
                            setFilteredItems([])
                        }
                    }}
                    onBlur={(e) => {
                        e.preventDefault()
                        if (searchValue && searchValue.length > 0) {
                            const searchProps = tree.getSearchInputElementProps()
                            if (searchProps.onChange) {
                                const syntheticEvent = {
                                    target: { value: searchValue },
                                } as React.ChangeEvent<HTMLInputElement>
                                searchProps.onChange(syntheticEvent)
                            }
                        }
                    }}
                    type="search"
                    placeholder="Filter ..."
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <FilterIcon className="size-4" aria-hidden="true" />
                </div>
                {searchValue && (
                    <button
                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Clear search"
                        onClick={handleClearSearch}
                    >
                        <CircleXIcon className="size-4" aria-hidden="true" />
                    </button>
                )}
            </div>

            <Tree indent={indent} tree={tree}>
                {searchValue && filteredItems.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm">
                        No items found for "{searchValue}"
                    </p>
                ) : treeItems.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No items to display
                    </p>
                ) : (
                    treeItems.map((item) => {
                        const isVisible = shouldShowItem(item.getId())
                        const isLeaf = !item.isFolder()

                        return (
                            <TreeItem
                                key={item.getId()}
                                item={item}
                                data-visible={isVisible || !searchValue}
                                className="data-[visible=false]:hidden"
                            >
                                <TreeItemLabel
                                    className={cn(
                                        isLeaf && "cursor-pointer hover:bg-accent/50"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        {item.isFolder() ?
                                            (item.isExpanded() ? (<FolderOpenIcon className="pointer-events-none size-4 text-muted-foreground" />) : (
                                                <FolderIcon className="pointer-events-none size-4 text-muted-foreground" />
                                            )) : (<FileIcon className="pointer-events-none size-4 text-muted-foreground" />)}
                                        {item.getItemName()}
                                    </span>
                                </TreeItemLabel>
                            </TreeItem>
                        )
                    })
                )}
            </Tree>
        </div>
    )
}