import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: ReactNode;
}

export default function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  return (
    <div className="bg-card rounded-xl p-5 card-shadow hover:card-shadow-hover transition-shadow duration-300 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-card-foreground">{value}</p>
          <p className={`text-xs mt-2 font-medium ${
            changeType === "positive" ? "text-success" :
            changeType === "negative" ? "text-destructive" :
            "text-muted-foreground"
          }`}>
            {change}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gold-light flex items-center justify-center text-gold">
          {icon}
        </div>
      </div>
    </div>
  );
}
