import { useQuery } from "@tanstack/react-query";
import { CreditCard, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MetricCard from "@/components/dashboard/MetricCard";
import { apiGet } from "@/lib/api";

const statusBadge = (s: string) => {
  switch (s) {
    case "Success": return "bg-success/10 text-success border-0";
    case "Failed": return "bg-destructive/10 text-destructive border-0";
    case "Pending": return "bg-warning/10 text-warning border-0";
    default: return "";
  }
};

export default function PaymentsPage() {
  const { data: transactions = [] } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const result = await apiGet<any[]>("/payments");
      return result.map((payment) => ({
        id: payment.transaction_id,
        order: payment.order_id,
        amount: Number(payment.amount),
        method: payment.provider,
        status: `${payment.status}`.charAt(0).toUpperCase() + `${payment.status}`.slice(1),
        date: payment.created_at ? new Date(payment.created_at).toISOString().slice(0, 10) : "-",
      }));
    },
  });
  const totalCollected = transactions
    .filter((transaction) => transaction.status === "Success")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const successCount = transactions.filter((transaction) => transaction.status === "Success").length;
  const failedCount = transactions.filter((transaction) => transaction.status === "Failed").length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payments</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Collected" value={`₹${totalCollected.toLocaleString()}`} change="Live data" changeType="neutral" icon={<CreditCard className="w-5 h-5" />} />
        <MetricCard title="Successful" value={`${successCount}`} change="Live data" changeType="positive" icon={<CheckCircle className="w-5 h-5" />} />
        <MetricCard title="Failed" value={`${failedCount}`} change="Needs attention" changeType="negative" icon={<XCircle className="w-5 h-5" />} />
      </div>

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-semibold">Transaction History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left">
              <th className="p-4 font-medium text-muted-foreground">Transaction</th>
              <th className="p-4 font-medium text-muted-foreground hidden sm:table-cell">Order</th>
              <th className="p-4 font-medium text-muted-foreground">Amount</th>
              <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Method</th>
              <th className="p-4 font-medium text-muted-foreground">Status</th>
              <th className="p-4 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
            </tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="p-4 font-medium">{t.id}</td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">#{t.order}</td>
                  <td className="p-4 font-medium">₹{t.amount.toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{t.method}</td>
                  <td className="p-4"><Badge className={statusBadge(t.status)}>{t.status}</Badge></td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
