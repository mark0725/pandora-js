"use client"

import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

export interface Option {
    value: string
    label: string
    disable?: boolean
    /** fixed option that can't be removed. */
    fixed?: boolean
    /** Group the options by providing key. */
    [key: string]: string | boolean | undefined
}

interface GroupOption {
    [key: string]: Option[]
}

interface SelectProps {
    value?: string
    defaultValue?: string

    open?: boolean
    defaultOpen?: boolean
    onOpenChange?(open: boolean): void

    name?: string
    autoComplete?: string
    required?: boolean
    disabled?: boolean

    defaultOptions?: Option[]
    /** manually controlled options */
    options?: Option[]

    placeholder?: string
    /** Loading component. */
    loadingIndicator?: React.ReactNode
    /** Empty component. */
    emptyIndicator?: React.ReactNode
    /** Debounce time for async search. Only work with `onSearch`. */
    delay?: number
    triggerSearchOnFocus?: boolean
    onSearch?: (value: string) => Promise<Option[]>
    onSearchSync?: (value: string) => Option[]
    onChange?: (option: Option | null) => void
    /** Group the options base on provided key. */
    groupBy?: string
    className?: string
    badgeClassName?: string
    /**
     * First item selected is a default behavior by cmdk. That is why the default is true.
     * This is a workaround solution by add a dummy item.
     *
     * @reference: https://github.com/pacocoursey/cmdk/issues/171
     */
    selectFirstItem?: boolean
    /** Allow user to create option when there is no option matched. */
    creatable?: boolean
    commandProps?: React.ComponentPropsWithoutRef<typeof Command>
    inputProps?: Omit<
        React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
        "value" | "placeholder" | "disabled"
    >
}

function useDebounce<T>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

function transToGroupOption(options: Option[], groupBy?: string) {
    if (options.length === 0) {
        return {}
    }
    if (!groupBy) {
        return {
            "": options,
        }
    }

    const groupOption: GroupOption = {}
    options.forEach((option) => {
        const key = (option[groupBy] as string) || ""
        if (!groupOption[key]) {
            groupOption[key] = []
        }
        groupOption[key].push(option)
    })
    return groupOption
}

export function SelectSearch({
    value,
    defaultValue,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    name,
    autoComplete,
    required,
    disabled,
    defaultOptions: arrayDefaultOptions = [],
    options: arrayOptions,
    placeholder,
    loadingIndicator,
    emptyIndicator,
    delay = 300,
    triggerSearchOnFocus = false,
    onSearch,
    onSearchSync,
    onChange,
    groupBy,
    className,
    selectFirstItem = true,
    creatable = false,
    commandProps,
    inputProps,
}: SelectProps) {
    const { t } = useTranslation()
    const inputRef = React.useRef<HTMLInputElement>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    const [isLoading, setIsLoading] = React.useState(false)

    // 初始化 selected 状态
    const getInitialSelected = React.useCallback(() => {
        if (value) {
            const found = arrayDefaultOptions.find((opt) => opt.value === value)
            return found || null
        }
        if (defaultValue) {
            const found = arrayDefaultOptions.find((opt) => opt.value === defaultValue)
            return found || null
        }
        return null
    }, [value, defaultValue, arrayDefaultOptions])

    const [selected, setSelected] = React.useState<Option | null>(getInitialSelected)

    const [options, setOptions] = React.useState<GroupOption>(
        transToGroupOption(arrayDefaultOptions, groupBy)
    )
    const [inputValue, setInputValue] = React.useState("")
    const debouncedSearchTerm = useDebounce(inputValue, delay || 500)

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node)
        ) {
            setOpen(false)
        }
    }

    useEffect(() => {
        if (open) {
            document.addEventListener("mousedown", handleClickOutside)
            document.addEventListener("touchend", handleClickOutside)
        } else {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchend", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchend", handleClickOutside)
        }
    }, [open])

    // 当 value 或 arrayDefaultOptions 变化时更新 selected
    useEffect(() => {
        if (value !== undefined) {
            // 从所有可用选项中查找
            const allOptions = arrayOptions || arrayDefaultOptions
            const found = allOptions.find((opt) => opt.value === value)
            setSelected(found || null)
        }
    }, [value, arrayDefaultOptions, arrayOptions])

    useEffect(() => {
        if (!arrayOptions || onSearch) {
            return
        }
        const newOption = transToGroupOption(arrayOptions || [], groupBy)
        if (JSON.stringify(newOption) !== JSON.stringify(options)) {
            setOptions(newOption)
        }
    }, [arrayDefaultOptions, arrayOptions, groupBy, onSearch, options])

    useEffect(() => {
        const doSearchSync = () => {
            const res = onSearchSync?.(debouncedSearchTerm)
            setOptions(transToGroupOption(res || [], groupBy))
        }

        const exec = async () => {
            if (!onSearchSync || !open) return

            if (triggerSearchOnFocus) {
                doSearchSync()
            }

            if (debouncedSearchTerm) {
                doSearchSync()
            }
        }

        void exec()
    }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus, onSearchSync])

    useEffect(() => {
        const doSearch = async () => {
            setIsLoading(true)
            const res = await onSearch?.(debouncedSearchTerm)
            setOptions(transToGroupOption(res || [], groupBy))
            setIsLoading(false)
        }

        const exec = async () => {
            if (!onSearch || !open) return

            if (triggerSearchOnFocus) {
                await doSearch()
            }

            if (debouncedSearchTerm) {
                await doSearch()
            }
        }

        void exec()
    }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus, onSearch])

    const handleSelect = React.useCallback((option: Option) => {
        setSelected(option)
        onChange?.(option)
        setOpen(false)
        setInputValue("")
    }, [onChange, setOpen])

    const CreatableItem = () => {
        if (!creatable || !inputValue) return null

        const allOptions = Object.values(options).flat()
        if (
            allOptions.find((opt) => opt.value === inputValue) ||
            selected?.value === inputValue
        ) {
            return null
        }

        const Item = (
            <CommandItem
                value={inputValue}
                className="cursor-pointer"
                onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
                onSelect={(value: string) => {
                    const newOption = { value, label: value }
                    handleSelect(newOption)
                }}
            >
                {t("components.selectSearch.create", { value: inputValue })}
            </CommandItem>
        )

        if (!onSearch && inputValue.length > 0) {
            return Item
        }

        if (onSearch && debouncedSearchTerm.length > 0 && !isLoading) {
            return Item
        }

        return null
    }

    const EmptyItem = () => {
        if (!emptyIndicator) return null

        if (onSearch && !creatable && Object.keys(options).length === 0) {
            return (
                <CommandItem value="-" disabled>
                    {emptyIndicator}
                </CommandItem>
            )
        }

        return <CommandEmpty>{emptyIndicator}</CommandEmpty>
    }

    return (
        <div ref={dropdownRef} className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-controls="select-search-dropdown"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className={cn(
                    "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                )}
            >
                <span className={cn(!selected && "text-muted-foreground")}>
                    {selected ? selected.label : (placeholder || t("components.selectSearch.placeholder"))}
                </span>
                <ChevronDownIcon className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
            </button>

            {/* Hidden input for form */}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={selected?.value || ""}
                    required={required}
                    autoComplete={autoComplete}
                />
            )}

            {/* Dropdown */}
            <div
                id="select-search-dropdown"
                className={cn(
                    "border-input bg-popover text-popover-foreground absolute top-full z-50 mt-2 w-full overflow-hidden rounded-md border shadow-md",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    !open && "hidden"
                )}
                data-state={open ? "open" : "closed"}
            >
                {open && (
                    <Command
                        {...commandProps}
                        className={cn("h-full overflow-visible bg-transparent", commandProps?.className)}
                        shouldFilter={
                            commandProps?.shouldFilter !== undefined
                                ? commandProps.shouldFilter
                                : !onSearch
                        }
                        filter={
                            creatable
                                ? (value: string, search: string) => {
                                    return value.toLowerCase().includes(search.toLowerCase()) ? 1 : -1
                                }
                                : commandProps?.filter
                        }
                    >
                        {/* Search Input inside dropdown */}
                        <CommandInput
                            {...inputProps}
                            ref={inputRef}
                            value={inputValue}
                            onValueChange={(value) => {
                                setInputValue(value)
                                inputProps?.onValueChange?.(value)
                            }}
                            placeholder={t("components.selectSearch.searchPlaceholder")}
                            className={cn("border-b", inputProps?.className)}
                        />

                        <CommandList className="max-h-[300px] overflow-y-auto">
                            {isLoading ? (
                                <div className="py-6 text-center text-sm">
                                    {loadingIndicator || t("common.loading")}
                                </div>
                            ) : (
                                <>
                                    {EmptyItem()}
                                    {CreatableItem()}
                                    {!selectFirstItem && <CommandItem value="-" className="hidden" />}
                                    {Object.entries(options).map(([key, dropdowns]) => (
                                        <CommandGroup key={key} heading={key} className="overflow-auto">
                                            {dropdowns.map((option) => (
                                                <CommandItem
                                                    key={option.value}
                                                    value={option.value}
                                                    disabled={option.disable}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                    }}
                                                    onSelect={() => handleSelect(option)}
                                                    className={cn(
                                                        "cursor-pointer",
                                                        option.disable &&
                                                        "pointer-events-none cursor-not-allowed opacity-50"
                                                    )}
                                                    keywords={[option.label]}
                                                >
                                                    <CheckIcon
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selected?.value === option.value
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {option.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    ))}
                                </>
                            )}
                        </CommandList>
                    </Command>
                )}
            </div>
        </div>
    )
}