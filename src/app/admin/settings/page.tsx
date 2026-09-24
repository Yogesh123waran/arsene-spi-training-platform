import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsTabs } from "./SettingsTabs";

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Configure company profile, roles and platform preferences." />
      <SettingsTabs />
    </div>
  );
}
