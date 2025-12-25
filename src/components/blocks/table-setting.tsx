import { CSSProperties, useEffect, useId, useState } from "react"
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { MappingDict, DataTable } from '@/types'
import { GripVerticalIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "react-i18next"

function SortableItem({ id, label }: { id: string; label: string }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }
    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-1 mb-1 rounded border hover:bg-gray-50"
        >
            <div className="flex items-center space-x-2 overflow-hidden">
                <button {...attributes} {...listeners} className="cursor-grab text-gray-500 mr-1">
                    <GripVerticalIcon size="16" />
                </button>
                <span className="truncate">{label || id}</span>
            </div>
            <Switch defaultChecked={true} />
        </div>
    )
}

export function TableSetting({ dataTable, dataTables, mappingDict }: { dataTable: string, dataTables: Record<string, DataTable>, mappingDict?: MappingDict }) {
    const { t } = useTranslation()
    const [rowHeight, setRowHeight] = useState<string>("normal")
    const [fontSize, setFontSize] = useState<string>("medium")
    const [columnWidthMode, setColumnWidthMode] = useState<string>("auto")

    const dt = dataTables[dataTable]
    const columns = dt?.fields || []
    const [colOrder, setColOrder] = useState(columns.map((c) => c.id))

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor)
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (active.id !== over?.id && over) {
            setColOrder((items) => {
                const oldIndex = items.indexOf(String(active.id))
                const newIndex = items.indexOf(String(over.id))
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    return (
        <Tabs defaultValue="table-setting" className="items-center">
            <TabsList>
                <TabsTrigger value="table-setting">{t('components.tableSetting.tabs.tableOptions')}</TabsTrigger>
                <TabsTrigger value="column-setting">{t('components.tableSetting.tabs.columnOptions')}</TabsTrigger>
            </TabsList>

            <TabsContent value="table-setting">
                <div className="p-2 space-y-4">
                    <div className="flex items-center space-x-2">
                        <Label className="w-[80px]">{t('components.tableSetting.rowHeight.label')}</Label>
                        <Select
                            value={rowHeight}
                            onValueChange={(v) => setRowHeight(v)}
                        >
                            <SelectTrigger className="w-[120px] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="narrow">{t('components.tableSetting.rowHeight.narrow')}</SelectItem>
                                <SelectItem value="normal">{t('components.tableSetting.rowHeight.normal')}</SelectItem>
                                <SelectItem value="wide">{t('components.tableSetting.rowHeight.wide')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Label className="w-[80px]">{t('components.tableSetting.fontSize.label')}</Label>
                        <Select
                            value={fontSize}
                            onValueChange={(v) => setFontSize(v)}
                        >
                            <SelectTrigger className="w-[120px] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">{t('components.tableSetting.fontSize.small')}</SelectItem>
                                <SelectItem value="medium">{t('components.tableSetting.fontSize.medium')}</SelectItem>
                                <SelectItem value="large">{t('components.tableSetting.fontSize.large')}</SelectItem>
                                <SelectItem value="extraLarge">{t('components.tableSetting.fontSize.extraLarge')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Label className="w-[80px]">{t('components.tableSetting.columnWidth.label')}</Label>
                        <Select
                            value={columnWidthMode}
                            onValueChange={(v) => setColumnWidthMode(v)}
                        >
                            <SelectTrigger className="w-[120px] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">{t('components.tableSetting.columnWidth.auto')}</SelectItem>
                                <SelectItem value="fixed">{t('components.tableSetting.columnWidth.fixed')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="column-setting" >
                <div className="p-2 text-sm">
                    <p className="text-muted-foreground text-xs mb-2">
                        {t('components.tableSetting.columnSetting.hint')}
                    </p>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext items={colOrder} strategy={verticalListSortingStrategy}>
                            <ScrollArea className="flex rounded-md">
                                <div className="flex-1 max-h-150 flex flex-col">
                                    {colOrder.map((colId) => {
                                        const col = columns.find((c) => c.id === colId)
                                        if (!col) return null
                                        return (
                                            <SortableItem key={col.id} id={col.id} label={col.label || col.id} />
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </SortableContext>
                    </DndContext>
                </div>
            </TabsContent>
        </Tabs>
    )
}