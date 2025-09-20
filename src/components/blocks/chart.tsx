import React, { useEffect, useState, useContext, useRef } from "react"
import ReactECharts from 'echarts-for-react';
import { useParams } from "react-router-dom";
import { apiGet } from "@/api/app"
import { replaceTemplate } from "@/lib/util_string"
import { ViewComponentProps } from './types'

export const Chart = ({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">) => {
    const urlParams = useParams();
    const urlVars: Record<string, string> = {}
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(vo.api? true:false)
    const {api} = vo;
    const [option, setOption] = useState<any>({ ...vo.option})

    useEffect(() => {
        const fetchData = async (apiUrl: string, params?: URLSearchParams) => {
            const getUrl = replaceTemplate(apiUrl, urlVars)
            try {
                const result = await apiGet(getUrl, params)
                setData(result)

                let option = { ...vo.option}
                
                if (result.category_key) {
                    let category: string[] = []
                    option.series = []

                    for (let i = 0; i < result.source.length; i++) {
                        const source = result.source[i]
                        const category_key = source[result.category_key]
                        let row: any[] = []
                        for (let j = 0; j < result.dimensions.length; j++) {
                            const fieldId = result.dimensions[j]
                            row.push(source[fieldId]||0)
                        }
                        
                        vo.serie && option.series.push({ ...vo.serie, name:category_key, data: row})
                        category.push(category_key)
                    }

                    if (option.xAxis && option.xAxis.type === "category") {
                        option.xAxis['data'] = result.dimensions
                    }
                    if (option.yAxis && option.yAxis.type === "category") {
                        option.yAxis['data'] = result.dimensions
                    }
                } else if (vo.serie) { 
                    for (let i = 0; i < result.source.length; i++) {
                        const source = result.source[i]
                        let row: any[] = []
                        for (let j = 0; j < result.dimensions.length; j++) {
                            const fieldId = result.dimensions[j]
                            row.push(source[fieldId] || 0)
                        }

                        vo.serie && option.series.push({ ...vo.serie, data: row })
                    }
                } else {
                    let source: any[] = [result.dimensions]
                    for (let i = 0; i < result.source.length; i++) {
                        const obj = result.source[i]
                        let row: any[] = []
                        for (let j = 0; j < result.dimensions.length; j++) {
                            const fieldId = result.dimensions[j]
                            row.push(obj[fieldId] || 0)
                        }

                        source.push(row)
                    }
                    option.dataset = [{ source: source}]
                }

                setOption(option)
             
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        };

        if (api) {
           fetchData(api, );
        }
    }, [id, api, vo.option])
    return (
        <ReactECharts option={option || {}} showLoading={loading} notMerge={true} />
    )
}
