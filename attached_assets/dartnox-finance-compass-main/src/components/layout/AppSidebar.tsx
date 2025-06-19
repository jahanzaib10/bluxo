
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
            <h2 className="text-lg font-semibold text-white truncate">Dartnox</h2>
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
                      isActive={isActive}
                      onClick={() => handleNavigation(item)}
                      tooltip={item.title}
                      className={`
                        mx-1 mb-1 rounded-lg transition-all duration-200 text-white/80 hover:text-white
                        ${isActive 
                          ? 'bg-white/15 text-white font-medium shadow-lg backdrop-blur-sm border border-white/20' 
                          : 'hover:bg-white/10 hover:backdrop-blur-sm'
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/20 bg-transparent">
        <div className="p-2">
          <SidebarMenuButton
            onClick={toggleTheme}
            tooltip={theme === "light" ? "Dark Mode" : "Light Mode"}
            className="w-full justify-start mx-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            {theme === "light" ? (
              <>
                <Moon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Light Mode</span>
              </>
            )}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
