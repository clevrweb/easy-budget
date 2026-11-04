"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { IncomeForm } from "@/components/income/income-form";
import { useDict } from "@/components/language-provider";

export function AddEntryMenu() {
  const [incomeOpen, setIncomeOpen] = useState(false);
  const dict = useDict();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={dict.bills.addBill}
          className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center bg-[var(--color-primary)] text-white"
        >
          <Plus className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href="/bills/new">{dict.bills.addBill}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIncomeOpen(true)}>
            {dict.income.addIncome}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <IncomeForm open={incomeOpen} onOpenChange={setIncomeOpen} />
    </>
  );
}
