import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {IconApple} from "@/components/icons/apple"
import {IconGoogle} from "@/components/icons/google"
import { IconMeta } from "@/components/icons/meta"

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden py-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="/static/images/placeholder.svg"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                    <form className="p-6 md:p-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">AI Station</h1>
                                <p className="text-balance text-muted-foreground">
                                    欢迎登录!
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">登录邮箱</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">密码</Label>
                                    {/* <a
                                        href="#"
                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                    >
                                        Forgot your password?
                                    </a> */}
                                </div>
                                <Input id="password" type="password" placeholder="输入您的登录密码"  required />
                            </div>
                            <Button type="submit" className="w-full">
                                登录
                            </Button>
                            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                    其他方式登录
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <Button variant="outline" className="w-full">
                                    <IconApple />
                                    <span className="sr-only">Login with Apple</span>
                                </Button>
                                <Button variant="outline" className="w-full">
                                    <IconGoogle />
                                    <span className="sr-only">Login with Google</span>
                                </Button>
                                <Button variant="outline" className="w-full">
                                    <IconMeta/>
                                    <span className="sr-only">Login with Meta</span>
                                </Button>
                            </div>
                           
                        </div>
                    </form>
                   
                </CardContent>
            </Card>
            {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                点击继续即表示您同意我们的<a href="#">《服务条款》</a>{" "}
                和 <a href="#">《隐私政策》</a>.
            </div> */}
        </div>
    )
}
