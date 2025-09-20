
interface IframeLayoutProps {
    url: string
    title: string
}
export default function IframeLayout(props: IframeLayoutProps) {
    const {
        url,
        title,
    } = props

    return ( <iframe src={url} className="w-full h-full border-none" title={title} /> )
}