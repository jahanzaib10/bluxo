import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { DollarSign, BarChart3, Users, Settings, Moon, Sun, UserCheck, CreditCard } from "lucide-react"
import { useTheme } from "@/components/theme/ThemeProvider"
import { Button } from "@/components/ui/button"
import { useNavigate, useLocation } from "react-router-dom"

const menuItems = [
  {
    title: "Overview",
    icon: BarChart3,
    path: "/overview"
  },
  {
    title: "Finance",
    icon: CreditCard,
    path: "/finance"
  },
  {
    title: "Clients",
    icon: Users,
    path: "/clients"
  },
  {
    title: "Employees",
    icon: UserCheck,
    path: "/employees"
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings"
  }
]

interface AppSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const handleNavigation = (item: typeof menuItems[0]) => {
    const tabValue = item.path.replace('/', '')
    onTabChange(tabValue)
    navigate(item.path)
  }

  const getCurrentPath = () => {
    if (location.pathname === '/') return 'overview'
    return location.pathname.replace('/', '')
  }

  return (
    <Sidebar 
      collapsible="icon" 
      className="h-full border-0"
      style={{
        background: 'linear-gradient(90deg, rgb(19, 37, 93) -70.68%, rgb(4, 1, 42) 100%)'
      }}
    >
      <SidebarHeader className="border-b border-sidebar-border/20 bg-transparent">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
            <DollarSign className="h-5 w-5 text-white flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">Bluxo</h2>
            <p className="text-sm text-white/70 truncate">Finance Logger</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-transparent overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50 text-xs font-medium px-3 py-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {menuItems.map((item) => {
                const isActive = getCurrentPath() === item.path.replace('/', '')
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item)}
                      className={`
                        w-full h-11 px-3 py-2 rounded-lg transition-all duration-200
                        flex items-center gap-3 text-left
                        ${isActive 
                          ? 'bg-white/20 text-white backdrop-blur-sm shadow-lg' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border/20 bg-transparent p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white h-10"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="font-medium">
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}