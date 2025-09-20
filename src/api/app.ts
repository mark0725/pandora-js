import { AppConfig, PageLayoutConfig } from '../types'
import { replaceTemplate } from '../lib/util_string'

interface ApiResult {
    code: string
    message: string
    data?: any
}

export async function fetchAppConfig(): Promise<AppConfig> {
    const result = await apiGet('/api/app/config')
    return result
}

export async function fetchPageLayoutConfig(pageId: string, params?: Record<string, string>): Promise<PageLayoutConfig> {
    const params2 = new URLSearchParams();
    params && Object.entries(params).forEach(([key, value]) => {
        params2.set(key, value);
    });
    const url = `/api/app/config/${pageId}`
    const result = await apiGet(url, params2)
    return result
}

export async function apiRequest(url: string, method: string, params?: URLSearchParams, body?: any): Promise<any> {
    console.log(method, url)
    const [path, queryString] = url.split("?");
    const params2 = new URLSearchParams(queryString);
    params?.forEach((value, key) => {
        params2.set(key, value);
    });
    const target = params2.size>0? `${path}?${params2.toString()}`:`${path}`;
    
    const resp = await fetch(target, {
        method: method.toUpperCase(),
        headers: {
            'Content-Type': 'application/json', // 发送JSON数据
        },
        body: body&&JSON.stringify(body),
    })

    const json = await resp.json()
    if (!json && !resp.ok) throw new Error("发生异常");
    if (!json ) throw new Error("请求失败");

    if (json.code !== 'OK') throw new Error(json.message||"服务器异常")

    const content = json.data?? {}
    return content
}

export async function apiGet(url: string, params?: URLSearchParams): Promise<any> {
    return await apiRequest(url, "GET", params)
}

export async function apiPost(url: string, body?: any, params?: URLSearchParams): Promise<any> {
    return await apiRequest(url, "POST", params, body)
}

export async function apiPut(url: string, params?: URLSearchParams): Promise<any> {
    return await apiRequest(url, "PUT", params)
}

export async function apiDelete(url: string, params?: URLSearchParams): Promise<any> {
    return await apiRequest(url, "DELETE", params)
}