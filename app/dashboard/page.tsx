import { SubmitButton } from "@/components/submit-button";
import { BrokerOptions } from "@/components/broker-options";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, hasActiveAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { Workspace } from "@/components/workspace";
import { buildLedger, money } from "@/lib/ledger";
import { submitPayment } from "@/app/actions";
import { PaymentOptions } from "@/components/payment-options";
export default async function Dashboard() {
    const u = await requireUser();
    if (u.role === "ADMIN") redirect("/admin");
    if (!(await hasActiveAccess(u.id))) {
        const payment = await db.payment.findFirst({
            where: { userId: u.id },
            orderBy: { createdAt: "desc" },
        });
        return (
            <Workspace name={u.name}>
                <section className="card max-w-3xl space-y-4">
                    <h1 className="page-title">
                        Account access: {u.status.replaceAll("_", " ")}
                    </h1>
                    {u.status === "SUSPENDED" ? (
                        <p>Account suspended. Contact your administrator.</p>
                    ) : payment?.status === "SUBMITTED" ? (
                        <p>
                            Payment awaiting manual verification. Reference:{" "}
                            {payment.reference}
                        </p>
                    ) : (
                        <>
                            <p className="muted">
                                Complete payment and submit your transaction
                                reference for manual approval.
                            </p>
                            <PaymentOptions
                                cashfreeUrl={
                                    process.env.CASHFREE_PAYMENT_LINK || ""
                                }
                                bankName={process.env.PAYMENT_BANK_NAME || ""}
                                accountName={
                                    process.env.PAYMENT_ACCOUNT_NAME || ""
                                }
                                accountNumber={
                                    process.env.PAYMENT_ACCOUNT_NUMBER || ""
                                }
                                ifsc={process.env.PAYMENT_IFSC || ""}
                            />
                            <form action={submitPayment} className="grid gap-3">
                                <select name="method">
                                    <option value="BANK_TRANSFER">
                                        Bank transfer
                                    </option>
                                    <option value="CASHFREE_LINK">
                                        UPI / Card
                                    </option>
                                </select>
                                <input
                                    name="reference"
                                    minLength={6}
                                    placeholder="Transaction reference / UTR"
                                    required
                                />
                                <input
                                    name="amount"
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Amount paid in ₹"
                                    required
                                />
                                <textarea
                                    name="note"
                                    placeholder="Optional payment note"
                                />
                                <SubmitButton className="btn">
                                    Submit for verification
                                </SubmitButton>
                            </form>
                        </>
                    )}
                </section>
            </Workspace>
        );
    }
    const [settings, profile, entries, trades] = await Promise.all([
        db.ledgerSettings.findUnique({ where: { userId: u.id } }),
        db.onboardingProfile.findUnique({ where: { userId: u.id } }),
        db.ledgerDay.findMany({ where: { userId: u.id } }),
        db.trade.findMany({
            where: { userId: u.id },
            orderBy: { tradedAt: "desc" },
            take: 5,
        }),
    ]);
    const ledger = buildLedger(
        {
            startingCapital: Number(
                settings?.startingCapital ?? profile?.startingBalance ?? 80000,
            ),
            tradingDays: settings?.tradingDays ?? 220,
            targetPct: Number(settings?.targetPct ?? 3),
            maxLossPct: Number(settings?.maxLossPct ?? 2),
            riskPct: Number(settings?.riskPct ?? 1),
            startDate: settings?.startDate ?? new Date(),
            holidayDates: settings?.holidayDates ?? "",
        },
        entries.map((x) => ({
            dayNumber: x.dayNumber,
            date: x.date,
            grossProfit: Number(x.grossProfit),
            grossLoss: Number(x.grossLoss),
            charges: Number(x.charges),
            deposit: Number(x.deposit),
            withdrawal: Number(x.withdrawal),
            tradesTaken: x.tradesTaken,
            notes: x.notes ?? "",
        })),
    );
    const recorded = ledger.rows.filter((x) => x.recorded).slice(-40);
    const maxClosing = Math.max(1, ...recorded.map((x) => x.closing));
    const links = [
        ["Excel-style capital journal", "/ledger"],
        ["Trade history", "/journal"],
        ["Trading calendar", "/calendar"],
        ["Mistake analysis", "/mistakes"],
        ["Performance reports", "/reports"],
    ];
    return (
        <Workspace name={u.name}>
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between gap-3">
                    <div>
                        <p className="text-xs text-blue-600 uppercase font-bold tracking-widest">
                            Performance overview
                        </p>
                        <h1 className="page-title">
                            Welcome back, {u.name || "Trader"}
                        </h1>
                        <p className="muted text-sm">
                            Your private trading performance at a glance.
                        </p>
                    </div>
                    <Link href="/journal" className="btn">
                        + New trade
                    </Link>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                        ["Account balance", money(ledger.balance)],
                        ["Net P&L", money(ledger.cumulative)],
                        ["Winning sessions", String(ledger.wins)],
                        ["Trading sessions", String(ledger.completed)],
                    ].map(([label, value]) => (
                        <div className="card" key={label}>
                            <p className="muted text-sm">{label}</p>
                            <p className="metric">{value}</p>
                        </div>
                    ))}
                </div>
                <div className="grid xl:grid-cols-3 gap-4">
                    <section className="card xl:col-span-2">
                        <h2 className="font-bold text-lg">Capital growth</h2>
                        <p className="muted text-xs mb-4">
                            Actual daily closing balance (₹)
                        </p>
                        <div className="flex items-end h-48 gap-1 border-b border-slate-200">
                            {recorded.map((x) => (
                                <div
                                    key={x.day}
                                    title={
                                        "Day " + x.day + ": " + money(x.closing)
                                    }
                                    className="bg-blue-500 rounded-t flex-1 min-w-1"
                                    style={{
                                        height:
                                            Math.max(
                                                3,
                                                Math.min(
                                                    100,
                                                    (x.closing / maxClosing) *
                                                    100,
                                                ),
                                            ) + "%",
                                    }}
                                />
                            ))}
                            {!ledger.completed && (
                                <div className="m-auto muted">
                                    Record a journal day to see your capital
                                    curve.
                                </div>
                            )}
                        </div>
                    </section>
                    <section className="card">
                        <h2 className="font-bold text-lg mb-4">Quick access</h2>
                        <div className="space-y-3">
                            {links.map(([label, href]) => (
                                <Link
                                    href={href}
                                    key={href}
                                    className="block border rounded-xl p-3 text-sm font-semibold hover:bg-blue-50"
                                >
                                    {label} →
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
                <section className="card">
                    <h2 className="font-bold text-lg mb-3">Recent trades</h2>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Symbol</th>
                                    <th>Direction</th>
                                    <th>Quantity</th>
                                    <th>Net P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((t) => {
                                    const net =
                                        (Number(t.exitPrice) -
                                            Number(t.entryPrice)) *
                                        Number(t.quantity) *
                                        (t.side === "LONG" ? 1 : -1) -
                                        Number(t.fees);
                                    return (
                                        <tr key={t.id}>
                                            <td>
                                                {t.tradedAt
                                                    .toISOString()
                                                    .slice(0, 10)}
                                            </td>
                                            <td>{t.symbol}</td>
                                            <td>{t.side}</td>
                                            <td>{String(t.quantity)}</td>
                                            <td
                                                className={
                                                    net >= 0 ? "good" : "bad"
                                                }
                                            >
                                                {money(net)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {!trades.length && (
                            <p className="muted py-5">
                                No trades yet. Add your first trade to get
                                started.
                            </p>
                        )}
                    </div>
                </section>
                <BrokerOptions compact />
            </div>
        </Workspace>
    );
}
