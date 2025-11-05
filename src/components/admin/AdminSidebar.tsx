import { LayoutDashboard, FileText, Image, Settings, ChevronDown } from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useBlogPostsAdmin } from '@/hooks/useBlogPostsAdmin';
import logo from '@/assets/revillion-logo.png';

export function AdminSidebar() {
  const { lang = 'en' } = useParams();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Fetch draft count for badge
  const { data: draftPosts } = useBlogPostsAdmin({
    lang,
    statusFilter: 'draft',
    page: 1,
    limit: 100,
  });
  const draftCount = draftPosts?.length || 0;

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: `/${lang}/admin`,
    },
    {
      title: 'Articoli',
      icon: FileText,
      path: `/${lang}/admin/blog`,
      badge: draftCount,
      submenu: [
        { title: 'Tutti gli articoli', path: `/${lang}/admin/blog` },
        { title: 'Aggiungi nuovo', path: `/${lang}/admin/blog/new` },
      ],
    },
  ];

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-[hsl(var(--border))]"
    >
      <SidebarHeader className="border-b border-[hsl(var(--border))] p-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Casino Blog" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <h2 className="font-semibold text-sm">Admin Panel</h2>
            </div>
          </div>
        ) : (
          <img 
            src={logo} 
            alt="Logo" 
            className="h-8 w-8 object-contain mx-auto"
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) =>
                item.submenu ? (
                  <Collapsible key={item.title} defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full">
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1">{item.title}</span>
                              {item.badge > 0 && (
                                <Badge variant="secondary" className="ml-auto">
                                  {item.badge}
                                </Badge>
                              )}
                              <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenu className="ml-4 border-l border-[hsl(var(--border))] pl-2">
                          {item.submenu.map((subitem) => (
                            <SidebarMenuItem key={subitem.title}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={subitem.path}
                                  end
                                  className={({ isActive }) =>
                                    isActive
                                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                                      : 'hover:bg-[hsl(var(--accent))]'
                                  }
                                >
                                  <span className="text-sm">{subitem.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
                            : 'hover:bg-[hsl(var(--accent))]'
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[hsl(var(--border))] p-4">
        {!isCollapsed ? (
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            <p>© 2024 Casino Blog</p>
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
