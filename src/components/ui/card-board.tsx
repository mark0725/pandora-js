import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

// ============ Types ============
interface ActionType {
  type: string;
  payload?: any;
}

interface LabelItem {
  text: string;
  color?: string;
  bgColor?: string;
  hoverColor?: string;
  hoverBgColor?: string;
  action?: ActionType;
}

interface ActionItem {
  text: string;
  icon?: string;
  iconColor?: string;
  color?: string;
  action?: ActionType;
}

interface CardItem {
  id?: string;
  title?: string;
  titleColor?: string;
  titleHoverColor?: string;
  desc?: string;
  descColor?: string;
  icon?: string;
  group: string;
  labels?: (string | LabelItem)[];
  actions?: ActionItem[];
  action?: ActionType;
  renderTitle?: () => React.ReactNode;
  [key: string]: any;
}

interface CardGroup {
  id: string;
  title: string;
  icon?: string;
}

// ============ Enums ============
enum LayoutTypeEnum {
  DEFAULT = 'default',
  LABEL = 'label',
}

// ============ Props ============
interface CardBoardProps {
  className?: string;
  layoutType?: `${LayoutTypeEnum}`;
  style?: React.CSSProperties;
  hideLogo?: boolean;
  hideMenu?: boolean;
  hideMenuLogo?: boolean;
  hideSearch?: boolean;
  hideSwitchTheme?: boolean;
  hideScrollTop?: boolean;
  hideGroupIcon?: boolean;
  hideFooter?: boolean;
  direction?: 'column' | 'row';
  logo?: string;
  title?: string;
  groups?: CardGroup[];
  items?: CardItem[];
  background?: string;
  footDesc?: string;
  footCopyright?: string;
  selectValue?: string[];
  selectColor?: string;
  hideItemIcon?: boolean;
  tagField?: string;
  tagMultiSelect?: boolean;
  showTagAll?: boolean;
  maxWidth?: number;
  cardMinWidth?: number;
  cardMaxWidth?: number;
  cardGap?: number;
  renderItemTitle?: (item: CardItem) => React.ReactNode;
  groupExtra?: (groupId: string) => React.ReactNode;
  actionEvent?: (action: ActionType) => void;
  onSelect?: (item: CardItem) => void;
}

// ============ Helper Functions ============
// 判断字符是否为中文
const isChinese = (char: string): boolean => {
  return /[\u4e00-\u9fa5]/.test(char);
};

// 截断文本：最大4个字母或2个汉字
const truncateIconText = (text: string): string => {
  if (!text) return '?';

  let result = '';
  let count = 0;
  const maxUnits = 4; // 4个单位（1个汉字=2单位，1个字母=1单位）

  for (const char of text) {
    const charUnits = isChinese(char) ? 2 : 1;
    if (count + charUnits > maxUnits) break;
    result += char;
    count += charUnits;
  }

  return result || text.charAt(0);
};

// 深色背景色数组
const darkColors = [
  'bg-slate-800',
  'bg-gray-800',
  'bg-zinc-800',
  'bg-neutral-800',
  'bg-stone-800',
  'bg-red-800',
  'bg-orange-800',
  'bg-amber-800',
  'bg-yellow-800',
  'bg-lime-800',
  'bg-green-800',
  'bg-emerald-800',
  'bg-teal-800',
  'bg-cyan-800',
  'bg-sky-800',
  'bg-blue-800',
  'bg-indigo-800',
  'bg-violet-800',
  'bg-purple-800',
  'bg-fuchsia-800',
  'bg-pink-800',
  'bg-rose-800',
  'bg-slate-600',
  'bg-gray-600',
  'bg-zinc-600',
  'bg-neutral-600',
  'bg-stone-600',
  'bg-red-600',
  'bg-orange-600',
  'bg-amber-600',
  'bg-yellow-600',
  'bg-lime-600',
  'bg-green-600',
  'bg-emerald-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-sky-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-purple-600',
  'bg-fuchsia-600',
  'bg-pink-600',
  'bg-rose-600',
  'bg-slate-700',
  'bg-gray-700',
  'bg-zinc-700',
  'bg-neutral-700',
  'bg-stone-700',
  'bg-red-700',
  'bg-orange-700',
  'bg-amber-700',
  'bg-yellow-700',
  'bg-lime-700',
  'bg-green-700',
  'bg-emerald-700',
  'bg-teal-700',
  'bg-cyan-700',
  'bg-sky-700',
  'bg-blue-700',
  'bg-indigo-700',
  'bg-violet-700',
  'bg-purple-700',
  'bg-fuchsia-700',
  'bg-pink-700',
  'bg-rose-700',
];

// 计算最优列数和卡片宽度
const calculateGridLayout = (containerWidth: number, minCardWidth: number, maxCardWidth: number, gap: number, itemCount: number): { columnCount: number; cardWidth: number } => {
  if (containerWidth <= 0) {
    return { columnCount: 1, cardWidth: minCardWidth };
  }

  // 计算在给定列数下，每个卡片的宽度
  const getCardWidth = (cols: number): number => {
    const totalGapWidth = (cols - 1) * gap;
    const availableWidth = containerWidth - totalGapWidth;
    return availableWidth / cols;
  };

  // 计算理论上的最大列数和最小列数
  const maxPossibleCols = Math.floor((containerWidth + gap) / (minCardWidth + gap));
  const minPossibleCols = Math.max(1, Math.ceil((containerWidth + gap) / (maxCardWidth + gap)));

  const cardWidth = Math.floor(Math.min(getCardWidth(maxPossibleCols), maxCardWidth))
  let bestLayout = { columnCount: maxPossibleCols, cardWidth: cardWidth };

  return bestLayout;
};

// ============ Custom Icon Component ============
const CustomIcon: React.FC<{ icon?: string; name?: string; size?: number; color?: string; }> = ({ icon, name, size = 40, color }) => {
  if (!icon) {
    const initial = truncateIconText(name?.toUpperCase() || '?');
    let sumcode = 0;
    for (let i = 0; i < (name?.length || 0); i++) sumcode += name!.charCodeAt(i);
    const colorIndex = name ? sumcode % darkColors.length : 0;

    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg text-white font-semibold',
          darkColors[colorIndex]
        )}
        style={{
          width: size,
          height: size,
          fontSize: initial.length > 2 ? size * 0.25 : size * 0.35
        }}
      >
        {initial}
      </div>
    );
  }

  if (icon.startsWith('http') || icon.startsWith('data:')) {
    return (
      <img
        src={icon}
        alt={name || ''}
        className="rounded-lg object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const displayText = truncateIconText(icon.toUpperCase());
  let sumcode = 0;
  for (let i = 0; i < icon.length; i++) sumcode += icon.charCodeAt(i);
  const colorIndex = icon ? sumcode % darkColors.length : 0;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg text-white font-semibold',
        darkColors[colorIndex]
      )}
      style={{
        width: size,
        height: size,
        fontSize: displayText.length > 2 ? size * 0.25 : size * 0.35,
        color: color || 'white'
      }}
    >
      {displayText}
    </div>
  );
};

// ============ Main Component ============
const CardBoard: React.FC<CardBoardProps> = ({
  className,
  layoutType = LayoutTypeEnum.LABEL,
  style,
  logo = '',
  title = '',
  direction = 'row',
  groups = [],
  items = [],
  hideMenu = false,
  hideMenuLogo = false,
  hideLogo = false,
  hideSearch = false,
  hideSwitchTheme = true,
  hideGroupIcon = false,
  hideScrollTop = false,
  hideFooter = false,
  background = '',
  footDesc = '',
  footCopyright = '',
  selectValue = [],
  selectColor,
  hideItemIcon = false,
  tagField = 'labels',
  tagMultiSelect = false,
  showTagAll = true,
  cardMinWidth = 340,
  cardMaxWidth = 400,
  cardGap = 16,
  renderItemTitle,
  groupExtra,
  actionEvent,
  onSelect,
}) => {
  const { t } = useTranslation();
  const mainRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [tempSearchText, setTempSearchText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showScrollTopBtn, setShowScrollBtn] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(showTagAll ? [t('components.cardBoard.allTag')] : []);
  const [visibleTagCount, setVisibleTagCount] = useState(10);

  // 监听容器宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (!contentRef.current) return;
      const { width, height } = contentRef.current.getBoundingClientRect();
      setContainerWidth(width);

      // 计算可见标签数量
      const tagWidth = 80;
      const availableWidth = width - 200;
      setVisibleTagCount(Math.max(3, Math.floor(availableWidth / tagWidth)));
    };

    const observer = new ResizeObserver(updateWidth);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }
    updateWidth();

    return () => observer.disconnect();
  }, []);

  // 提取所有标签
  useEffect(() => {
    const allTagText = t('components.cardBoard.allTag');
    const newTags = new Set<string>();
    items.forEach((item) => {
      const tagFieldValues = item[tagField];
      if (typeof tagFieldValues === 'string') {
        tagFieldValues && newTags.add(tagFieldValues);
      }
      if (Array.isArray(tagFieldValues)) {
        tagFieldValues.forEach((v: any) => {
          const text = typeof v === 'string' ? v : v?.text || '';
          text && newTags.add(text);
        });
      }
    });
    setTags(showTagAll ? [allTagText, ...newTags] : [...newTags]);
  }, [tagField, items, showTagAll, t]);

  // 过滤后的列表
  const list = useMemo(() => {
    const allTagText = t('components.cardBoard.allTag');
    const groupIds = groups.map((v) => v.id);
    const itemMap = items.reduce((acc: { [key: string]: CardItem[] }, item) => {
      if (selectedTags.length && !selectedTags.includes(allTagText)) {
        const tagFieldValues = item[tagField];
        if (Array.isArray(tagFieldValues)) {
          const hasTag = tagFieldValues.some((v) => {
            const text = typeof v === 'string' ? v : v?.text || '';
            return selectedTags.includes(text);
          });
          if (!hasTag) return acc;
        } else if (typeof tagFieldValues === 'string') {
          if (!selectedTags.includes(tagFieldValues)) return acc;
        } else {
          return acc;
        }
      }

      const group = groupIds.includes(item.group) ? item.group : '_other';
      if (group in acc) {
        acc[group].push(item);
      } else {
        acc[group] = [item];
      }
      return acc;
    }, {});

    const result = groups.map((group) => ({
      ...group,
      items: itemMap[group.id] ?? [],
    }));

    if ('_other' in itemMap) {
      result.push({
        id: '_other',
        title: t('components.cardBoard.otherGroup'),
        items: itemMap._other,
      });
    }

    return result;
  }, [items, groups, selectedTags, tagField, t]);

  // 计算当前显示的所有项目数量
  const totalVisibleItems = useMemo(() => {
    return list.reduce((sum, group) => sum + group.items.length, 0);
  }, [list]);

  // 计算网格布局
  const gridLayout = useMemo(() => {
    return calculateGridLayout(
      containerWidth,
      cardMinWidth,
      cardMaxWidth,
      cardGap,
      totalVisibleItems
    );
  }, [containerWidth, cardMinWidth, cardMaxWidth, cardGap, totalVisibleItems]);

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!searchText) return [];
    const results: CardItem[] = [];
    list.forEach((group) => {
      group.items.forEach((item) => {
        if (item.title?.toLowerCase().includes(searchText.toLowerCase())) {
          results.push(item);
        }
      });
    });
    return results;
  }, [searchText, list]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSearchText(tempSearchText);
    }
  };

  const handleTagClick = (tag: string) => {
    const allTagText = t('components.cardBoard.allTag');
    if (!tagMultiSelect) {
      setSelectedTags(tag === selectedTags[0] ? [allTagText] : [tag]);
      return;
    }

    if (tag === allTagText) {
      setSelectedTags([allTagText]);
    } else {
      const newTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag && t !== allTagText)
        : [...selectedTags.filter((t) => t !== allTagText), tag];
      setSelectedTags(newTags.length ? newTags : [allTagText]);
    }
  };

  const smoothScrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 渲染标签
  const renderTags = () => {
    if (layoutType !== LayoutTypeEnum.LABEL) return null;

    const visibleTags = tags.slice(0, visibleTagCount);
    const hiddenTags = tags.slice(visibleTagCount);

    return (
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {visibleTags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'rounded-1 transition-all h-7 px-3 text-xs font-normal',
                selectedTags.includes(tag)
                  ? 'bg-primary text-primary-foreground hover:bg-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent border-muted'
              )}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </Button>
          ))}

          {hiddenTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={hiddenTags.some((t) => selectedTags.includes(t)) ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'rounded-1 h-7 px-3 text-xs font-normal',
                    hiddenTags.some((t) => selectedTags.includes(t))
                      ? 'bg-primary'
                      : 'text-muted-foreground border-muted'
                  )}
                >
                  {t('components.cardBoard.more')}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                {hiddenTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{tag}</span>
                    {selectedTags.includes(tag) && <Check className="h-3.5 w-3.5 ml-2 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 搜索框 */}
        {!hideSearch && (
          <div className="relative w-[200px]">
            <Input
              placeholder={t('components.cardBoard.searchPlaceholder')}
              value={tempSearchText}
              onChange={(e) => setTempSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-16 h-8 text-sm"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {tempSearchText && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setTempSearchText('');
                    setSearchText('');
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setSearchText(tempSearchText)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染应用项底部
  const renderItemFooter = (item: CardItem) => {
    if (!item.labels && !item.actions) return null;

    return (
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 flex-wrap">
          {item.labels?.map((label, i) => {
            const labelData = typeof label === 'string' ? { text: label } : label;
            return (
              <Badge
                key={i}
                variant="secondary"
                className={cn(
                  'text-xs font-normal cursor-default transition-all duration-200 px-1.5 py-0',
                  'hover:bg-primary/20 hover:text-primary hover:scale-105',
                  labelData.action && 'cursor-pointer'
                )}
                style={{
                  color: labelData.color,
                  backgroundColor: labelData.bgColor,
                }}
                onClick={(e) => {
                  if (labelData.action) {
                    e.stopPropagation();
                    actionEvent?.(labelData.action);
                  }
                }}
              >
                {labelData.text}
              </Badge>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {item.actions?.map((action, i) => (
            <button
              key={i}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (action.action) {
                  actionEvent?.(action.action);
                }
              }}
            >
              {action.icon && (
                <CustomIcon icon={action.icon} size={13} color={action.iconColor} />
              )}
              <span style={{ color: action.color }}>{action.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 渲染应用项
  const renderItem = (item: CardItem, index: number) => {
    const isSelected = item?.id && selectValue.includes(item.id);

    return (
      <div
        key={item.id || index}
        className={cn(
          'group rounded-xl border bg-card p-4 transition-all duration-300 ease-out',
          'hover:shadow-lg hover:border-primary/30',
          'hover:-translate-y-1',
          onSelect && 'cursor-pointer',
          isSelected && 'ring-2 ring-primary bg-primary/5'
        )}
        style={{
          width: gridLayout.cardWidth,
          minWidth: cardMinWidth,
          maxWidth: cardMaxWidth,
          ...(isSelected && selectColor ? { backgroundColor: selectColor } : {})
        }}
        onClick={() => onSelect?.(item)}
      >
        <div className={cn('flex gap-3', direction === 'column' && 'flex-col items-center text-center')}>
          {!hideItemIcon && (
            <div className="flex-shrink-0 flex-col items-center">
              <CustomIcon icon={item.icon} name={item.title} size={direction === 'column' ? 50 : 48} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                'text-sm text-foreground/90 truncate leading-relaxed',
                item.action && 'cursor-pointer hover:text-primary'
              )}
              style={{ color: item.titleColor }}
              onClick={(e) => {
                if (item.action) {
                  e.stopPropagation();
                  actionEvent?.(item.action);
                }
              }}
            >
              {item.renderTitle?.() || renderItemTitle?.(item) || item.title}
            </div>
            {item.desc && (
              <div
                className="text-xs text-muted-foreground/80 mt-1 line-clamp-2"
                style={{ color: item.descColor }}
              >
                {item.desc}
              </div>
            )}
            {renderItemFooter(item)}
          </div>
        </div>
      </div>
    );
  };

  // 渲染网格容器 - 使用 justify-start 确保卡片从左侧开始
  const renderGrid = (children: React.ReactNode) => {
    return (
      <div
        className="flex flex-wrap justify-start"
        style={{
          gap: cardGap,
        }}
      >
        {children}
      </div>
    );
  };

  // 渲染应用列表
  const renderCards = () => {
    if (searchText) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Search className="h-4 w-4" />
            <span>{t('components.cardBoard.searchResultsFor', { keyword: searchText })}</span>
          </div>
          {searchResults.length > 0 ? (
            renderGrid(searchResults.map((item, index) => renderItem(item, index)))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t('components.cardBoard.noResults')}
            </div>
          )}
        </div>
      );
    }

    return (
      <div ref={contentRef} className="space-y-8">
        {list.map((group) => (
          <div key={group.id}>
            {group.id !== '_other' && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {!hideGroupIcon && group.icon && (
                    <CustomIcon icon={group.icon} name={group.title} size={20} />
                  )}
                  <h3 className="text-base font-normal text-foreground/90">{group.title}</h3>
                </div>
                {groupExtra?.(group.id)}
              </div>
            )}
            {(group.id !== '_other' || list.length === 1) && group.items.length > 0 && (
              renderGrid(group.items.map((item, index) => renderItem(item, index)))
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full min-h-full bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50',
        className
      )}
      style={{
        ...style,
        ...(background ? { background } : {}),
      }}
    >
      <ScrollArea
        ref={mainRef}
        className="h-full w-full"
        onScrollCapture={(e: any) => {
          setShowScrollBtn(e.target.scrollTop > 100);
        }}
      >
        <div
          className="p-6 mx-auto w-full"
        >
          {/* Logo & Banner for default layout */}
          {layoutType === LayoutTypeEnum.DEFAULT && !hideLogo && (
            <div className="flex flex-col items-center gap-4 mb-8">
              {logo && <CustomIcon icon={logo} name={title} size={60} />}
              {title && <h1 className="text-xl font-medium text-foreground/90">{title}</h1>}
              {!hideSearch && (
                <div className="relative w-full max-w-md">
                  <Input
                    placeholder={t('components.cardBoard.searchPlaceholder')}
                    value={tempSearchText}
                    onChange={(e) => setTempSearchText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pr-16 text-sm"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {tempSearchText && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setTempSearchText('');
                          setSearchText('');
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setSearchText(tempSearchText)}
                    >
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags for label layout */}
          {renderTags()}

          {/* Cards Grid */}
          {renderCards()}

          {/* Footer */}
          {!hideFooter && (footDesc || footCopyright) && (
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              {!hideLogo && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  {logo && <CustomIcon icon={logo} name={title} size={24} />}
                  {title && <span className="font-normal text-foreground/80">{title}</span>}
                </div>
              )}
              {footDesc && <p className="mb-2 text-muted-foreground/80">{footDesc}</p>}
              {footCopyright && <p className="text-muted-foreground/70">{footCopyright}</p>}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Scroll to top button */}
      {!hideScrollTop && showScrollTopBtn && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full shadow-lg h-9 w-9"
          onClick={smoothScrollToTop}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};


export default CardBoard;