import { format, addDays, subDays, addMonths, subMonths, addYears, subYears } from 'date-fns';

export function calcDateByExpr(expr: string, baseDate: Date = new Date()): string {
    const regex = /^$$([A-Z]+)([+-]\d+)$$-(.+)$/;
    const match = expr.match(regex);

    let date = baseDate;
    let dateFormat = expr;

    if (match) {
        const [, type, numStr, formatStr] = match;
        const num = parseInt(numStr, 10);

        switch (type) {
            case 'DAY':
                date = num >= 0 ? addDays(baseDate, num) : subDays(baseDate, -num);
                break;
            case 'MONTH':
                date = num >= 0 ? addMonths(baseDate, num) : subMonths(baseDate, -num);
                break;
            case 'YEAR':
                date = num >= 0 ? addYears(baseDate, num) : subYears(baseDate, -num);
                break;
            default:
                break;
        }
        dateFormat = formatStr;
    }

    return format(date, dateFormat);
}
