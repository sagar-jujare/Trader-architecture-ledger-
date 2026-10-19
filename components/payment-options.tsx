"use client";
import { useState } from "react";
type Props = {
    cashfreeUrl: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
};
export function PaymentOptions(p: Props) {
    const [tab, setTab] = useState<"cashfree" | "bank">("cashfree");
    const validLink = (() => {
        try {
            const u = new URL(p.cashfreeUrl);
            return (
                u.protocol === "https:" &&
                (/(^|\.)cashfree\.com$/.test(u.hostname) ||
                    /(^|\.)cashfreepayments\.com$/.test(u.hostname))
            );
        } catch {
            return false;
        }
    })();
    return (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5 space-y-4">
            <h3 className="font-semibold text-lg">Choose how to pay</h3>
            <div className="grid grid-cols-2 gap-2">
                {(["cashfree", "bank"] as const).map((t) => (
                    <button
                        type="button"
                        key={t}
                        onClick={() => setTab(t)}
                        className={
                            "rounded-lg py-2 px-2 text-sm " +
                            (tab === t
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-slate-300")
                        }
                    >
                        {t === "cashfree" ? "UPI / Card" : "Bank Transfer"}
                    </button>
                ))}
            </div>
            {tab === "cashfree" &&
                (validLink ? (
                    <>
                        <p className="text-slate-300 text-sm">
                            Pay securely using the Cashfree-hosted payment link
                            provided by the administrator.
                        </p>
                        <a
                            className="btn inline-block"
                            href={p.cashfreeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Pay using UPI / Card
                        </a>
                    </>
                ) : (
                    <p className="text-amber-300 text-sm">
                        Cashfree payment link is not configured yet. Contact the
                        administrator.
                    </p>
                ))}
            {tab === "bank" && (
                <dl className="text-sm space-y-2">
                    {[
                        ["Bank", p.bankName],
                        ["Account name", p.accountName],
                        ["Account number", p.accountNumber],
                        ["IFSC", p.ifsc],
                    ].map(([k, v]) => (
                        <div
                            key={k}
                            className="flex justify-between gap-3 border-b border-slate-800 pb-2"
                        >
                            <dt className="text-slate-400">{k}</dt>
                            <dd className="text-right break-all">
                                {v || "Not configured"}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}
