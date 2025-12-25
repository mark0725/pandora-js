// import {
//     RiLoader4Line,
// } from "@remixicon/react"

import React from "react";
import { useTranslation } from 'react-i18next';

export function Loadding({title, className}: React.ComponentProps<"div">&{title?:string}) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center  h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="text-white/70 my-4">{title ? title : t("common.loading")}</span>
        </div>
        //  <div className="flex flex-col items-center justify-center h-screen">
        //  <RiLoader4Line className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        //  <span className="text-gray-700">正在加载...</span>
    //  </div>
    )
}