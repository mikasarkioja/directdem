"use client";

interface BillWithGap {
  id: string;
  title: string;
  parliamentId: string;
  parliamentStance: number;
  citizenStance: number;
  gap: number;
  isHighGap: boolean;
}

interface DeficitTableProps {
  bills: BillWithGap[];
}

export default function DeficitTable({ bills }: DeficitTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-nordic-gray dark:border-nordic-darker">
            <th className="text-left py-3 px-4 text-sm font-semibold text-nordic-darker dark:text-nordic-white">
              Bill Name
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-nordic-darker dark:text-nordic-white">
              Parliament Stance (%)
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-nordic-darker dark:text-nordic-white">
              Citizen Stance (%)
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-nordic-darker dark:text-nordic-white">
              Gap (%)
            </th>
          </tr>
        </thead>
        <tbody>
          {bills.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-nordic-dark dark:text-nordic-gray">
                No bills found
              </td>
            </tr>
          ) : (
            bills.map((bill) => (
              <tr
                key={bill.id}
                className="border-b border-nordic-gray dark:border-nordic-darker hover:bg-nordic-light dark:hover:bg-nordic-darker transition-colors"
              >
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-nordic-darker dark:text-nordic-white">
                      {bill.title}
                    </div>
                    <div className="text-xs text-nordic-dark dark:text-nordic-gray mt-1">
                      {bill.parliamentId}
                    </div>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-nordic-darker dark:text-nordic-white">
                  {bill.parliamentStance}%
                </td>
                <td className="text-right py-3 px-4 text-nordic-darker dark:text-nordic-white">
                  {bill.citizenStance}%
                </td>
                <td className="text-right py-3 px-4">
                  <span
                    className={`font-semibold ${
                      bill.isHighGap
                        ? "text-red-600 dark:text-red-400"
                        : "text-nordic-darker dark:text-nordic-white"
                    }`}
                  >
                    {bill.gap}%
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

