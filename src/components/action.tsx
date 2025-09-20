import { toast } from 'sonner';
import { MappingDict, Operation } from '@/types'
import { PageModelContext, PageViewContext,PageModelContextType } from "@/context/page-context"
import { apiRequest } from "@/api/app"
import {useContext } from 'react'
function replaceTemplate(template: string, params: Record<string, string>) {
    return template.replace(/\${(\w+)}/g, (_, key) => params[key] ?? '');
}

export async function handleOperation({ oper, ctx, record, urlVars }: { oper: Operation, ctx: PageModelContextType | null | undefined, record?: Record<string, any> | null | undefined, urlVars?: Record<string, string> }) {

    switch (oper.actionType) {
        case 'view':
            oper.view && ctx?.showView(oper.view, record ? record : undefined);
            break;
        case 'api':
            if (!oper.api) {
                toast.error('请配置API接口');
                return;
            } else {
                const apiUrl = replaceTemplate(oper.api, { ...(record || {}), ...(urlVars || {})}); 
                const method = oper.method || 'GET';
                const params = new URLSearchParams()
                console.log('apiUrl', apiUrl)
                const loadingId = toast.loading('正在处理中...', { position: 'top-center' });
                try {
                    const result = await apiRequest(apiUrl, method, params, record);
                    console.log('result', result)
                    oper.effects && ctx?.effects(oper.effects.split(","))
                    toast.success('操作成功', {
                        position: 'top-center'
                    });
                    return result;
                } catch (error: any) {
                    console.log(error)
                    toast.error(error.message, {
                        position: 'top-center'
                    })
                } finally {
                    toast.dismiss(loadingId)
                }
            }
            // const result = await apiRequest(apiUrl, params);
            break;
        case 'download':
            console.log('download =>', oper);
            break;
        case 'export':
            console.log('export =>', oper);
            break;
        case 'import':
            console.log('import =>', oper);
            break;
        case 'batch':
            console.log('batch =>', oper);
            break;
        case 'confirm':
            console.log('confirm =>', oper);
            break;
        
        default:
            console.log('confirm =>', oper);
            toast('执行操作', {
                description: oper.label,
                duration: 3000,
                icon: '👏',
                position: 'top-center'
            });
    }
}

