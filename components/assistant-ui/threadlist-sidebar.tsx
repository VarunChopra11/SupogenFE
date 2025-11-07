"use client";

import * as React from "react";
import { Github, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { useBackendAuth } from "@/context/backend-auth";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";

type Server = {
  server_id: string;
  server_name: string;
  member_count: number;
};

type ThreadListSidebarProps = React.ComponentProps<typeof Sidebar> & {
  setSelectedServer: (server: any) => void;
};

export function ThreadListSidebar({
  setSelectedServer,
  ...props
}: ThreadListSidebarProps) {
  const { user } = useBackendAuth();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [servers, setServers] = React.useState<Server[]>([]);
  const [serversLoading, setServersLoading] = React.useState<boolean>(false);
  const [serversError, setServersError] = React.useState<string | null>(null);
  const { authenticatedFetch } = useAuthenticatedFetch();

  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function loadServers() {
      try {
        setServersLoading(true);
        setServersError(null);
        const res = await authenticatedFetch("/auth/discord/get_servers", {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Failed to load servers (${res.status})`);
        const data = (await res.json()) as { servers: Server[] };
        if (!active) return;
        setServers(Array.isArray(data?.servers) ? data.servers : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setServersError(e?.message || "Failed to load servers");
      } finally {
        setServersLoading(false);
      }
    }
    loadServers();
    return () => {
      active = false;
      controller.abort();
    };
  }, [authenticatedFetch]);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header mb-2 border-b">
        <div className="aui-sidebar-header-content flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className=" ">
                <div className="">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[260px] justify-between"
                      >
                        {value
                          ? servers.find(
                              (server) => server.server_name === value
                            )?.server_name
                          : "Select server..."}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search server..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No framework found.</CommandEmpty>
                          <CommandGroup>
                            {servers.map((server) => (
                              <CommandItem
                                key={server.server_id}
                                value={server.server_name}
                                onSelect={(currentValue) => {
                                  setValue(
                                    currentValue === value ? "" : currentValue
                                  );
                                  setOpen(false);
                                  setSelectedServer(server.server_id);
                                }}
                              >
                                {server.server_name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    value === server.server_name
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent className="aui-sidebar-content px-2">
        <ThreadList />
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter className="aui-sidebar-footer border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <SignedIn>
                  <UserButton />
                </SignedIn>

                <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none">
                  <span className="aui-sidebar-footer-title font-semibold">
                    {" "}
                    {user?.name || user?.email || "User"}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
