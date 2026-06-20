import { Euro } from "lucide-react";
import { StatCard } from "../shared/Cards.jsx";
import { Input, Select } from "../shared/FormControls.jsx";

export function ExpenseManager({
  expenseForm,
  editingExpenseId,
  expenseMonthFilter,
  expenseCategoryFilter,
  filteredExpenses,
  filteredExpenseTotal,
  expenseCategories,
  items,
  money,
  onSaveExpense,
  onSetExpenseForm,
  onCancelExpenseEdit,
  onSetExpenseMonthFilter,
  onSetExpenseCategoryFilter,
  onEditExpense,
  onDeleteExpense,
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-[#f0be45]/20 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">Bookkeeping prep</h2>
            <p className="mt-1 text-sm text-neutral-600">Add expenses and receipt notes so imported payouts, fees, and month-end totals are easier to match.</p>
          </div>
          <StatCard icon={Euro} label="Filtered monthly total" value={money(filteredExpenseTotal)} sub={`${filteredExpenses.length} records`} />
        </div>
      </div>

      <form onSubmit={onSaveExpense} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-950">{editingExpenseId ? "Edit expense" : "Add expense"}</h3>
            <p className="mt-1 text-sm text-neutral-500">Stored locally with the rest of your ResellIt records.</p>
          </div>
          {editingExpenseId && <button type="button" onClick={onCancelExpenseEdit} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel edit</button>}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Date" type="date" value={expenseForm.date} onChange={(e) => onSetExpenseForm({ ...expenseForm, date: e.target.value })} />
          <Select label="Category" value={expenseForm.category} onChange={(e) => onSetExpenseForm({ ...expenseForm, category: e.target.value })}>
            {expenseCategories.map((category) => <option key={category}>{category}</option>)}
          </Select>
          <Input label="Description" value={expenseForm.description} onChange={(e) => onSetExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Tape, boxes, fuel..." />
          <Input label="Amount EUR" value={expenseForm.amount} onChange={(e) => onSetExpenseForm({ ...expenseForm, amount: e.target.value })} />
          <Select label="Payment method" value={expenseForm.paymentMethod} onChange={(e) => onSetExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}>
            <option>Cash</option><option>Card</option><option>PayPal</option><option>Bank transfer</option><option>Other</option>
          </Select>
          <Select label="Receipt available" value={expenseForm.receiptAvailable} onChange={(e) => onSetExpenseForm({ ...expenseForm, receiptAvailable: e.target.value })}>
            <option>Yes</option><option>No</option>
          </Select>
          <Select label="Linked item optional" value={expenseForm.linkedItemId} onChange={(e) => onSetExpenseForm({ ...expenseForm, linkedItemId: e.target.value })}>
            <option value="">No linked item</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
          <Input label="Receipt notes" value={expenseForm.receiptNotes} onChange={(e) => onSetExpenseForm({ ...expenseForm, receiptNotes: e.target.value })} placeholder="Receipt location, note, missing reason..." />
        </div>
        <button type="submit" className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-orange-300 px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-orange-200 sm:w-auto">
          {editingExpenseId ? "Save Expense" : "Add Expense"}
        </button>
      </form>

      <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Filter month" type="month" value={expenseMonthFilter} onChange={(e) => onSetExpenseMonthFilter(e.target.value)} />
          <Select label="Filter category" value={expenseCategoryFilter} onChange={(e) => onSetExpenseCategoryFilter(e.target.value)}>
            <option>All categories</option>
            {expenseCategories.map((category) => <option key={category}>{category}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredExpenses.length === 0 && <p className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600 shadow-sm">No expenses match the current filters.</p>}
        {filteredExpenses.map((expense) => {
          const linkedItem = items.find((item) => item.id === expense.linkedItemId);
          return (
            <article key={expense.id} className="premium-card rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-neutral-950">{expense.description}</h3>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">{expense.category}</span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">{expense.receiptAvailable === "Yes" ? "Receipt" : "No receipt"}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{expense.date} / {expense.paymentMethod}{linkedItem ? ` / linked to ${linkedItem.name}` : ""}</p>
                  {expense.receiptNotes && <p className="mt-1 text-sm text-neutral-500">{expense.receiptNotes}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="rounded-2xl bg-stone-900 px-4 py-2 text-sm font-semibold text-amber-50">{money(expense.amount)}</p>
                  <button type="button" onClick={() => onEditExpense(expense)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Edit</button>
                  <button type="button" onClick={() => onDeleteExpense(expense.id)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Delete</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
