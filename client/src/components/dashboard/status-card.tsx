import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  status: "success" | "warning" | "error" | "neutral";
  subtitle: string;
}

export default function StatusCard({ title, value, icon: Icon, status, subtitle }: StatusCardProps) {
  const getStatusColors = () => {
    switch (status) {
      case "success":
        return {
          iconBg: "bg-success bg-opacity-10",
          iconColor: "text-success",
          valueColor: "text-success",
          subtitleColor: "text-success",
        };
      case "warning":
        return {
          iconBg: "bg-warning bg-opacity-10",
          iconColor: "text-warning",
          valueColor: "text-warning",
          subtitleColor: "text-warning",
        };
      case "error":
        return {
          iconBg: "bg-error bg-opacity-10",
          iconColor: "text-error",
          valueColor: "text-error",
          subtitleColor: "text-error",
        };
      default:
        return {
          iconBg: "bg-gray-100",
          iconColor: "text-gray-600",
          valueColor: "text-gray-900",
          subtitleColor: "text-gray-600",
        };
    }
  };

  const colors = getStatusColors();

  return (
    <Card className="bg-surface shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${colors.valueColor}`}>{value}</p>
          </div>
          <div className={`w-12 h-12 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
            <Icon className={`${colors.iconColor} h-6 w-6`} />
          </div>
        </div>
        <div className="mt-4">
          <div className={`flex items-center text-sm ${colors.subtitleColor}`}>
            {subtitle}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
