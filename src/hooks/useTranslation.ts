import { useTranslation as useI18nTranslation } from 'react-i18next';

// 类型安全的翻译hook
export function useTranslation() {
    const { t, i18n } = useI18nTranslation();

    return {
        t: t as (key: string, options?: any) => string,
        i18n,
        language: i18n.language,
        changeLanguage: i18n.changeLanguage,
    };
}