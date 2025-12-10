import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Upload, DollarSign, TrendingUp, Calendar } from "lucide-react";
import Papa from "papaparse";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

interface Transaction {
  TransactionDate: string;
  PostDate: string;
  Description: string;
  Category: string;
  Type: string;
  Amount: number;
}

interface CategoryData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface MonthlyData {
  month: string;
  amount: number;
}

interface DailyTransaction {
  amount: number;
  category: string;
  description: string;
}

interface DailyData {
  date: string;
  total: number;
  transactions: DailyTransaction[];
  [category: string]: string | number | DailyTransaction[];
}

interface Insights {
  categoryData: CategoryData[];
  monthlyData: MonthlyData[];
  dailyData: DailyData[];
  allCategories: string[];
  totalSpending: string;
  avgTransaction: string;
  topCategory: CategoryData;
  transactionCount: number;
}

export default function TransactionAnalyzer() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string>("");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      let allTransactions: Transaction[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();

        await new Promise<void>((resolve, reject) => {
          Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            delimitersToGuess: [",", "\t", "|", ";"],
            complete: (results: Papa.ParseResult<any>) => {
              const processed = results.data
                .map((row: any) => {
                  const transDate =
                    row["Transaction Date"] || row["TransactionDate"] || "";
                  const postDate = row["Post Date"] || row["PostDate"] || "";
                  const category = (row.Category || "").trim();
                  const amount = parseFloat(row.Amount) || 0;

                  return {
                    ...row,
                    Amount: amount,
                    TransactionDate: transDate,
                    PostDate: postDate,
                    Category: category,
                    Description: row.Description || "",
                    Type: row.Type || "",
                  } as Transaction;
                })
                .filter((row: Transaction) => row.Amount < 0 && row.Category);

              allTransactions = [...allTransactions, ...processed];
              resolve();
            },
            error: (err: Error) => {
              reject(err);
            },
          });
        });
      }

      setTransactions(allTransactions);
      setError("");
    } catch (err) {
      setError(
        `Error reading files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const insights = useMemo<Insights | null>(() => {
    if (transactions.length === 0) return null;

    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      const cat = t.Category;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.Amount);
    });

    const categoryData: CategoryData[] = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);

    const dailyGroups: Record<
      string,
      {
        date: string;
        total: number;
        categories: Record<string, number>;
        transactions: DailyTransaction[];
      }
    > = {};

    transactions.forEach((t) => {
      const date = t.TransactionDate;
      if (!dailyGroups[date]) {
        dailyGroups[date] = {
          date,
          total: 0,
          categories: {},
          transactions: [],
        };
      }
      const cat = t.Category;
      dailyGroups[date].total += Math.abs(t.Amount);
      dailyGroups[date].categories[cat] =
        (dailyGroups[date].categories[cat] || 0) + Math.abs(t.Amount);
      dailyGroups[date].transactions.push({
        amount: Math.abs(t.Amount),
        category: t.Category,
        description: t.Description,
      });
      dailyGroups[date].transactions.sort((a, b) => {
        return a.amount < b.amount ? 1 : -1;
      });
    });

    const dailyData: DailyData[] = Object.values(dailyGroups)
      .map((day) => ({
        date: day.date,
        total: parseFloat(day.total.toFixed(2)),
        ...Object.fromEntries(
          Object.entries(day.categories).map(([cat, amt]) => [
            cat,
            parseFloat(amt.toFixed(2)),
          ])
        ),
        transactions: day.transactions,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const allCategories = [
      ...new Set(transactions.map((t) => t.Category)),
    ].sort();

    const monthlyTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      const date = new Date(t.TransactionDate);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyTotals[monthKey] =
        (monthlyTotals[monthKey] || 0) + Math.abs(t.Amount);
    });

    const monthlyData: MonthlyData[] = Object.entries(monthlyTotals)
      .map(([month, amount]) => ({
        month,
        amount: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalSpending = categoryData.reduce((sum, cat) => sum + cat.value, 0);
    const avgTransaction = totalSpending / transactions.length;
    const topCategory = categoryData[0];

    return {
      categoryData,
      monthlyData,
      dailyData,
      allCategories,
      totalSpending: totalSpending.toFixed(2),
      avgTransaction: avgTransaction.toFixed(2),
      topCategory,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Transaction Analyzer
          </h1>
          <p className="text-gray-600">
            Upload your Chase CSV to analyze spending patterns. This site works just for Chase CSV's which you can download from Chase
          </p>
        </div>

        {!transactions.length && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Upload className="mx-auto mb-4 text-blue-500" size={48} />
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
                Upload CSV Files (Multiple)
              </span>
            </label>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        )}

        {insights && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Spending</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ${insights.totalSpending}
                    </p>
                  </div>
                  <DollarSign className="text-blue-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Transactions</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {insights.transactionCount}
                    </p>
                  </div>
                  <Calendar className="text-green-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Avg Transaction</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ${insights.avgTransaction}
                    </p>
                  </div>
                  <TrendingUp className="text-orange-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div>
                  <p className="text-gray-500 text-sm">Top Category</p>
                  <p className="text-xl font-bold text-gray-800">
                    {insights.topCategory?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${insights.topCategory?.value}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Spending by Category
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={insights.categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value}`} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Category Distribution
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={insights.categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(props: any) => `${props.name}: ${props.value}`}
                    >
                      {insights.categoryData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Daily Spending by Category
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insights.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date: string) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date: string) =>
                      new Date(date).toLocaleDateString()
                    }
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload as DailyData;
                        return (
                          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                            <p className="font-bold">
                              {new Date(data.date).toLocaleDateString()}
                            </p>
                            <p className="text-blue-600 font-semibold">
                              Total: ${data.total}
                            </p>
                            <div className="mt-2 space-y-1">
                              {data.transactions.map((t, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="text-gray-700">
                                    ${t.amount.toFixed(2)}
                                  </span>
                                  <span className="text-gray-500">
                                    {" "}
                                    - {t.description}
                                  </span>
                                  <span className="text-gray-400">
                                    {" "}
                                    ({t.category})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {insights.allCategories.map((category, idx) => (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Category Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Category</th>
                      <th className="text-right py-2 px-4">Amount</th>
                      <th className="text-right py-2 px-4">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.categoryData.map((cat, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{cat.name}</td>
                        <td className="text-right py-2 px-4">${cat.value}</td>
                        <td className="text-right py-2 px-4">
                          {(
                            (cat.value / parseFloat(insights.totalSpending)) *
                            100
                          ).toFixed(1)}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setTransactions([])}
              className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition"
            >
              Upload Different File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
