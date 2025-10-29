import { PageModel, MappingDict } from '../types'
import { apiGet } from './app'
import { replaceTemplate } from '@/lib/util_string'
import { toast } from 'sonner';
export async function fetchPageConfig(pageId: string, path: string, params: URLSearchParams): Promise<PageModel> {
    const url = params ? `${path}?${params.toString()}` : `${path}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to load data')
    return await res.json()
}

export async function fetchPageMapping(pageId: string, path: string, params: Record<string, any>, urlVars?: Record<string, string>): Promise<MappingDict|null> {
    const apiUrl = replaceTemplate(path, { ...(params || {}), ...(urlVars || {}) });
    const urlParams = new URLSearchParams()
    try {
        const result = await apiGet(apiUrl, urlParams);
        return result?.dict;
    } catch (error: any) {
        console.log(error)
        toast.error(error.message, {
            position: 'top-center'
        })
    } 
    
    return null
}
