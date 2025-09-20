import { DataField, ViewObject, MappingDict, DataTable, Operation } from "@/types"

export type RowData=Record<string, any>

export interface ViewComponentProps {
    id: string
    vo: ViewObject
    dataTables: Record<string, DataTable>
    operations: Record<string, Operation>
    key?: string
    data?: Record<string, any>
    children?: React.ReactNode[]
}

export interface TableBodyColumn extends DataField {
    width?: number | string
    fixed?: string
    filterable?: boolean
    components?: string
    sortable?: boolean
}


