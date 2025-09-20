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

export function TableSetting({
    dataTable,
    dataTables,
    mappingDict
}: {
    dataTable: string
    dataTables: Record<string, DataTable>
    mappingDict?: MappingDict
}) {
    const [rowHeight, setRowHeight] = useState<string>("常规")
    const [fontSize, setFontSize] = useState<string>("中")
    const [columnWidthMode, setColumnWidthMode] = useState<string>("自动")

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
                <TabsTrigger value="table-setting">表格选项</TabsTrigger>
                <TabsTrigger value="column-setting">列选项</TabsTrigger>
            </TabsList>

            <TabsContent value="table-setting">
                <div className="p-2 space-y-4">
                    <div className="flex items-center space-x-2">
                        <Label className="w-[80px]">行高</Label>
                        <Select
                            value={rowHeight}
                            onValueChange={(v) => setRowHeight(v)}
                        >
                            <SelectTrigger className="w-[120px] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="窄">窄</SelectItem>
                                <SelectItem value="常规">常规</SelectItem>
                                <SelectItem value="宽">宽</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Label className="w-[80px]">字体</Label>
                        <Select
                            value={fontSize}
                            onValueChange={(v) => setFontSize(v)}
                        >
                            <SelectTrigger className="w-[120px] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="小">小</SelectItem>
                                <SelectItem value="中">中</SelectItem>
                                <SelectItem value="大">大</SelectItem>
                                <SelectItem value="超大">超大</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Label className="w-[80px]">列宽</Label>
                        <Select
                            value={columnWidthMode}
                            onValueChange={(v) => setColumnWidthMode(v)}
                        >
                            <SelectTrigger className="w-[120px] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="自动">自动</SelectItem>
                                <SelectItem value="固定">固定</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="column-setting" >
                <div className="p-2 text-sm">
                    <p className="text-muted-foreground text-xs mb-2">
                        拖动可调整列顺序，开关可控制是否显示列
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