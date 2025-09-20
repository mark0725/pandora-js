import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MenuItem } from '../types'
import { useNavigate, } from "react-router-dom"
interface UserMenuProps {
    userName: string
    userMail: string
    avatar: string
    userItems: MenuItem[]
}

export function UserMenu({ userName, userMail, avatar, userItems }: UserMenuProps) {
    const navigate = useNavigate()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2">
                    <img src={avatar} alt="avatar" className="border-2 border-amber-50 w-10 h-10 rounded-full object-cover" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-2" side={"right"}>
                <div className="flex items-center space-x-2 p-2 mb-2 border-b">
                    <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                    <div className="text-sm">
                        <div className="font-semibold">{userName}</div>
                        <div className="text-gray-500 text-xs">{userMail}</div>
                    </div>
                </div>

                {userItems.map((item) => {
                    if (item.type === 'link' && item.url) {
                        return (
                            <DropdownMenuItem key={item.id}>
                                <a className="w-full" href={item.url}> {item.title} </a>
                            </DropdownMenuItem>
                        )
                    } else if (item.type === 'separator') {
                        return (
                            <DropdownMenuSeparator key={item.id} />
                        )
                    } else{
                        return (
                            <DropdownMenuItem key={item.id} onClick={() => navigate(`user/${item.id}`)} >
                                {item.title}
                            </DropdownMenuItem>
                        )
                    }
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
  }