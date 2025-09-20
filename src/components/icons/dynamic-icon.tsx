import React, { Suspense, SVGProps } from "react";
import {
    RiListCheck,
    RiHomeLine,
    RiSettings3Line,
    RiUserLine,
    RiTeamLine,
    RiStackLine,
    RiBox3Line,
    RiBankCard2Line,
    RiDatabase2Line,
    RiCpuLine,
    RiSoundModuleLine,
    RiNotificationLine,
} from "@remixicon/react"


type AllSVGProps = SVGProps<SVGSVGElement>
type ReservedProps = 'color' | 'size' | 'width' | 'height' | 'fill' | 'viewBox'
interface DynamicIconProps extends Pick<AllSVGProps, Exclude<keyof AllSVGProps, ReservedProps>> {
    name: string;
    color?: string;
    size?: number | string;
    children?: never;
  }
const DynamicIcon = ({ name }: DynamicIconProps) => {
    // 动态导入 svg 并作为 React 组件使用
    const IconComponent = React.lazy(() =>
        import(`../icons/${name}.svg`).then(module => ({ default: module.ReactComponent }))
    );

    return (
        <Suspense fallback={<span></span>}>
            <IconComponent />
        </Suspense>
    );
};


const iconMap: Record<string, React.ElementType> = {
    RiListCheck,
    RiHomeLine,
    RiSettings3Line,
    RiUserLine,
    RiTeamLine,
    RiStackLine,
    RiBox3Line,
    RiBankCard2Line,
    RiDatabase2Line,
    RiCpuLine,
    RiSoundModuleLine,
    RiNotificationLine,
}

export function getIcon(name: string, size?: number) {
    if (!name) return null
    const key = name.replace(";", "")
    const IconComponent = iconMap[key]
    
    return IconComponent ? <IconComponent size={size? size:16}/> : null
}

export default DynamicIcon;