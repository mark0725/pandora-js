import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"                // shadcn 的全局提示
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {ApiResult} from "@/api/app"
import { useAuthStore } from "@/store"
import { AppConfig, User } from '@/types'

export function LoginPage({ appConfig, className, ...props }: { appConfig: AppConfig }&React.ComponentProps<"div">) {
    const navigate = useNavigate()
    const setAuthed = useAuthStore(s => s.setAuthed)
    
    // 表单状态
    const [username, setUsername] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    // 提交处理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username || !password) {
            toast.warning("请输入账号和密码")
            return
        }
        try {
            setLoading(true)
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            })

            const data: ApiResult = await res.json()

            if (data.code === "OK") {
                toast.success("登录成功，正在跳转…")
                setAuthed(true)
                // setTimeout(() => {
                //     navigate("/")
                // }, 1000);
                
            } else {
                const detail = Object.values(data.error || {}).join(", ") || data.message
                toast.error(detail || "账号或密码错误")
            }
        } catch (err) {
            toast.error("网络异常，请稍后重试")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
                <div className={cn("flex flex-col items-center", className)} {...props}>
                    <Card className="overflow-hidden py-0 h-200 w-300]">
                        <CardContent className="grid p-0 md:grid-cols-2 h-full w-full">
                            <div className="relative hidden bg-muted md:block">
                                <img src="/static/images/banner.png?v=1" alt="banner" className="w-150 h-200 object-cover dark:brightness-[0.2] dark:grayscale" />
                            </div>
                            <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-8 px-12" >
                                <div className="text-center space-y-1">
                                    <h1 className="text-3xl font-bold">{appConfig?.app?.title}</h1>
                                    <p className="text-muted-foreground">欢迎登录！</p>
                                </div>
                                <div className="w-80 space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="username">账号</Label>
                                        <Input id="username" placeholder="请输入账号" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password">密码</Label>
                                        <Input id="password" type="password" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>

                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? "登录中..." : "登 录"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
        </div>
    )
}
