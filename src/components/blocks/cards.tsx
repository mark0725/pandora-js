import React, { useEffect, useState, useContext, useRef } from "react"
import ReactECharts from 'echarts-for-react';
import { useParams } from "react-router-dom";
import { apiGet } from "@/api/app"
import { replaceTemplate } from "@/lib/util_string"
import { ViewComponentProps } from './types'


export const Card = ({ id, vo, ...props }: ViewComponentProps & React.ComponentProps<"div">) => {
    const urlParams = useParams();
    const urlVars: Record<string, string> = {}
    Object.entries(urlParams).forEach(([key, value]) => {
        if (value && key !== '*') urlVars[key] = value
    });
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(vo.api? true:false)
    const {api} = vo;
    const [option, setOption] = useState<any>({ ...vo.option})

    return (
        <ReactECharts option={option || {}} showLoading={loading} notMerge={true} />
    )
    
}