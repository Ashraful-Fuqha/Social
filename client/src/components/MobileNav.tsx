import {
    Sheet, 
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "./ui/button"
import {Menu as MenuIcon} from 'lucide-react'
import { useState } from "react"
import { MenuItems } from "../../index"
import { Avatar } from "./ui/avatar"
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import LogoutButton from "./LogoutButton"


function MobileNav() {
  const [open,setOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <>
     <Sheet open={open} onOpenChange={setOpen}>
      {/* This button will trigger open the mobile sheet menu */}
      <SheetTrigger asChild className="h-7 md:h-8">
        <Button variant="ghost" size="icon" className="text-white bg-purple-600">
          <MenuIcon />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="md:w-[15rem] w-[12rem]">
        <SheetTitle hidden>Nav</SheetTitle>
        <Avatar className="ml-3 mt-2 size-[4rem] cursor-grab  ">
            <Link to={'/profile'}>
              <AvatarImage src={user?.avatarUrl ?? "https://github.com/shadcn.png"} className="object-fill" alt="@shadcn" />
              <AvatarFallback>{user?.fullname}</AvatarFallback>
            </Link>
        </Avatar>
        <h1 className="text-4xl my-2 ml-3 text-purple-600 font-bold">Social.</h1>
        <div className="flex flex-col items-start">
          {MenuItems.map((item) => (
            <Button key={item.id} variant="link" className="text-[1rem]" onClick={() => { setOpen(false); navigate(item.route) }} >
              {item.txt}
            </Button>
          ))}

          <LogoutButton/>
        </div>
      </SheetContent>
    </Sheet>
    </>
  )
}

export default MobileNav