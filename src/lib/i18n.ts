import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 导入本地翻译文件
import translationEN from '@/locales/en.json';
import translationZH from '@/locales/zh.json';

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', icon: '🇺🇸' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', icon: '🇨🇳' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', icon: '🇨🇳' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', icon: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', icon: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', icon: '🇰🇷' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', icon: '🇸🇦' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', icon: '🇷🇺' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', icon: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', icon: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', icon: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', icon: '🇮🇹' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl', icon: '🇮🇱' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: '🇮🇳' }
] as const;

// 本地静态翻译资源
const localResources: Record<string, { base: Record<string, unknown> }> = {
    en: {
        base: translationEN,
    },
    zh: {
        base: translationZH,
    },
};

// 默认初始化（仅使用本地资源）
i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: localResources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage', 'cookie'],
        },
    });

/**
 * 从 API 加载额外的命名空间翻译
 * @param namespaces - 需要加载的命名空间数组
 * @param options - 可选配置
 */
const loadRemoteNamespaces = async ( namespaces: string[], options?: { authToken?: string; baseUrl?: string; } ): Promise<void> => {
    const { authToken, baseUrl = '/api/app/i18n' } = options || {};

    // 配置 Backend 插件
    const backendOptions = {
        loadPath: `${baseUrl}/{{lng}}/{{ns}}`,
        customHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    };

    // 如果还没有使用 Backend，则添加
    if (!i18n.modules.backend) {
        i18n.use(Backend);
    }

    // 更新 backend 配置
    i18n.options.backend = backendOptions;

    // 添加新的命名空间
    const currentNs = i18n.options.ns;
    const allNs = Array.isArray(currentNs)
        ? [...new Set([...currentNs, ...namespaces])]
        : [...new Set(['translation', ...namespaces])];

    i18n.options.ns = allNs;

    // 加载远程命名空间
    const currentLng = i18n.language;
    const loadPromises = namespaces.map((ns) =>
        i18n.loadNamespaces(ns).catch((err) => {
            console.warn(`Failed to load namespace "${ns}" for language "${currentLng}":`, err);
            return null;
        })
    );

    await Promise.all(loadPromises);
};

/**
 * 手动添加翻译资源（合并到现有资源）
 * @param lng - 语言代码
 * @param ns - 命名空间
 * @param resources - 翻译资源对象
 */
const addTranslationResources = (
    lng: string,
    ns: string,
    resources: Record<string, unknown>
): void => {
    i18n.addResourceBundle(lng, ns, resources, true, true);
};

/**
 * 完整初始化（本地资源 + API 支持）
 * 用于需要同时使用本地和远程翻译的场景
 * @param config - 初始化配置
 */
const initI18nWithBackend = async (config: {
    namespaces?: string[];
    defaultNS?: string;
    authToken?: string;
    baseUrl?: string;
    debug?: boolean;
}): Promise<typeof i18n> => {
    const {
        namespaces = [],
        defaultNS = 'base',
        authToken,
        baseUrl = '/api/app/i18n',
        debug = false,
    } = config;

    // 确保 translation 命名空间包含在内
    const allNamespaces = [...new Set(['base', ...namespaces])];

    await i18n
        .use(Backend)
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            // 本地资源作为基础
            resources: localResources,

            // 回退语言
            fallbackLng: 'en',

            // 调试模式
            debug,

            // 后端配置（用于加载额外的命名空间）
            backend: {
                loadPath: `${baseUrl}/{{lng}}/{{ns}}`,
                customHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
            },

            // 语言检测配置
            detection: {
                order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
                lookupQuerystring: 'lang',
                lookupCookie: 'app_lang',
                lookupLocalStorage: 'app_lang',
                caches: ['localStorage', 'cookie'],
            },

            // 命名空间配置
            ns: allNamespaces,
            defaultNS,

            // 插值配置
            interpolation: {
                escapeValue: false,
            },

            // 本地资源优先，缺失时从后端加载
            partialBundledLanguages: true,

            // 缺失翻译处理
            saveMissing: debug,
            saveMissingTo: 'current',

            // 缺失键处理
            missingKeyHandler: debug
                ? (lng, ns, key) => {
                    console.warn(`Missing translation: [${lng}][${ns}] ${key}`);
                }
                : undefined,
        });

    return i18n;
};

/**
 * 切换语言
 * @param lng - 目标语言代码
 */
const changeLanguage = async (lng: string): Promise<void> => {
    await i18n.changeLanguage(lng);
};

/**
 * 获取当前语言信息
 */
const getCurrentLanguage = () => {
    const code = i18n.language;
    return SUPPORTED_LANGUAGES.find((lang) => lang.code === code) || SUPPORTED_LANGUAGES[0];
};

/**
 * 检查语言是否为 RTL（从右到左）
 */
const isRTL = (lng?: string): boolean => {
    const langCode = lng || i18n.language;
    const langInfo = SUPPORTED_LANGUAGES.find((lang) => lang.code === langCode);
    return langInfo && 'dir' in langInfo ? langInfo.dir === 'rtl' : false;
};

export {
    i18n,
    initI18nWithBackend,
    loadRemoteNamespaces,
    addTranslationResources,
    changeLanguage,
    getCurrentLanguage,
    isRTL,
};
