"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { siteConfig } from "@/config/site";

const usersMock = [
  { name: "Admin User", email: "admin@spi-training.local", role: "Super Admin", status: "active" },
  { name: "Rajesh Kumar", email: "trainer@spi-training.local", role: "Trainer", status: "active" },
  { name: "Arun Kumar", email: "student@spi-training.local", role: "Student", status: "active" },
];

export function SettingsTabs() {
  const { showToast } = useToast();

  function saveNotImplemented() {
    showToast({ variant: "info", title: "Settings aren't wired up yet", description: "This UI pass is presentation-only." });
  }

  return (
    <Tabs defaultValue="company">
      <TabsList>
        <TabsTrigger value="company">Company</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="roles">Roles</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>

      <TabsContent value="company">
        <Card>
          <CardContent className="flex max-w-lg flex-col gap-4">
            <Input label="Company name" defaultValue={siteConfig.companyName} />
            <Input label="Tagline" defaultValue={siteConfig.tagline} />
            <Input label="Support email" defaultValue={siteConfig.contact.email} />
            <Input label="Phone" defaultValue={siteConfig.contact.phone} />
            <Button className="w-fit" onClick={saveNotImplemented}>
              Save changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="profile">
        <Card>
          <CardContent className="flex max-w-lg flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name="Admin User" size="lg" tone="gold" />
              <Button variant="secondary" size="sm" onClick={saveNotImplemented}>
                Change photo
              </Button>
            </div>
            <Input label="Full name" defaultValue="Admin User" />
            <Input label="Email address" defaultValue="admin@spi-training.local" type="email" />
            <Button className="w-fit" onClick={saveNotImplemented}>
              Save changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users">
        <Card>
          <CardContent className="flex flex-col gap-3">
            {usersMock.map((u) => (
              <div key={u.email} className="flex items-center justify-between gap-3 border-b border-surface-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" tone="blue" />
                  <div>
                    <p className="text-sm font-medium text-ink">{u.name}</p>
                    <p className="text-xs text-ink-muted">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted">{u.role}</span>
                  <StatusBadge status={u.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="roles">
        <Card>
          <CardContent className="flex flex-col gap-3">
            {["Super Admin", "Trainer", "Student"].map((role) => (
              <div key={role} className="flex items-center justify-between border-b border-surface-border pb-3 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-ink">{role}</span>
                <Button variant="ghost" size="sm" onClick={saveNotImplemented}>
                  Edit permissions
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardContent className="flex max-w-lg flex-col gap-3">
            {["Email notifications", "Test reminders", "Attendance alerts", "Certificate issuance"].map((label) => (
              <label key={label} className="flex items-center justify-between text-sm text-ink">
                {label}
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-surface-border text-primary-500" />
              </label>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardContent className="flex max-w-lg flex-col gap-4">
            <Input label="Current password" type="password" placeholder="••••••••" />
            <Input label="New password" type="password" placeholder="••••••••" />
            <Button className="w-fit" onClick={saveNotImplemented}>
              Update password
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="system">
        <Card>
          <CardContent className="flex max-w-lg flex-col gap-4">
            <Select
              label="Session timeout"
              defaultValue="480"
              options={[
                { label: "1 hour", value: "60" },
                { label: "8 hours", value: "480" },
                { label: "24 hours", value: "1440" },
              ]}
            />
            <Select
              label="Default timezone"
              defaultValue="ist"
              options={[
                { label: "India Standard Time (IST)", value: "ist" },
                { label: "UTC", value: "utc" },
              ]}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
