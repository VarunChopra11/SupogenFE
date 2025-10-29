"use client";

import { UserProfile } from "@clerk/nextjs";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-6">
            <UserProfile
              path="/account"
              routing="path"
              appearance={{
                layout: {
                  showOptionalFields: true,
                  socialButtonsPlacement: "bottom",
                  socialButtonsVariant: "iconButton",
                },
                elements: {
                  rootBox:
                    "w-full max-w-4xl bg-white shadow-lg rounded-2xl overflow-hidden",
                  card: "w-full",
                },
              }}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
