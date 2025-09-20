import { calcDateByExpr } from '../lib/util_date'
import { Parser } from 'expr-eval'
import { format as dfFormat, addDays, startOfDay } from 'date-fns';

const rePercent = /%$/;
const reThousand = /#,##0(?!\.)/;
const reThousandD = /#,##0\.([0#]+)/;
const reFixedD = /^0\.([0#]+)$/;
const reInt = /^0$/;
const reDate = /y|M|d|H|m|s/i;     // 只要包含日期占位符，就按日期走

const excelEpoch = startOfDay(new Date(Date.UTC(1899, 11, 30))); // 1900-01-00
function serialToDate(serial: number) {
    return addDays(excelEpoch, serial);
}

function excelFormat(val: unknown, fmt: string): string {
    // ================= 日期类 =================
    if (reDate.test(fmt)) {
        const d: Date = val instanceof Date ? val
            : typeof val === 'number' ? serialToDate(val)
                : new Date(val as any);
        return dfFormat(d, fmt.replace(/"([^"]*)"/g, `'\$1'`));  // 把 Excel 的 "" 包装转成 date-fns 的 ''
    }

    console.log(typeof val)
    if (typeof val !== 'number' || Number.isNaN(val)) return '';

    if (rePercent.test(fmt)) {
        const decimals = (fmt.split('.')[1] || '').length;
        const n = (val * 100).toFixed(decimals);
        return `${n}%`;
    }

    if (reThousand.test(fmt)) {
        return Math.round(val).toLocaleString();
    }

    // ================= 千分位（小数） ==========
    const mThousandD = fmt.match(reThousandD);
    if (mThousandD) {
        const decimals = mThousandD[1].length;
        return val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    // ================= 固定小数位 ==============
    const mFixed = fmt.match(reFixedD);
    if (mFixed) {
        const decimals = mFixed[1].length;
        return val.toFixed(decimals);
    }

    // ================= 整数 ====================
    if (reInt.test(fmt)) return Math.round(val).toString();

    // Fallback：直接返回原值
    return String(val);
}

const parser = new Parser({
    operators: {
        concatenate: true, // 允许字符串拼接 '+'
    }
});

parser.functions.format = excelFormat


export function replaceTemplate(template: string, params: Record<string, string>) {
    return template.replace(/\${(.*?)}/g, (_, key: string) =>  {
        if (params.hasOwnProperty(key)) {
            return params[key];
        }

        if (key.startsWith('date-')) {
            return calcDateByExpr(key.substring(5));
        }

        try {
            return parser.evaluate(key, params || {}).toString()
        } catch (err) {
            if (err instanceof ReferenceError) {
                console.log('变量未定义');
            }
        }

        return ''
    });
}

export function transformObject(obj: any, params: Record<string, string>) {
    if(!obj) return obj;
    if (typeof obj === 'string') {
       
        return replaceTemplate(obj, params||{});
    }

    if (typeof obj === 'object' && obj !== null) {
        const result: Record<string, any> = {};
        for (const key in obj) {
            if(key.startsWith('__bind-')) {
                const newkey = key.substring(7);
                result[newkey] = replaceTemplate(obj[key], params||{});
                console.log('bind', key, obj[key], result[newkey]);
                continue;
            } else {
                result[key] = obj[key];
            }
        }
        return result
    }


    return obj
}