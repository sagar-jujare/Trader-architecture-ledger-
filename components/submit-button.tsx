"use client";
import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";
export function SubmitButton({
    children,
    pendingText = "Saving…",
    disabled,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    pendingText?: string;
    children: ReactNode;
}) {
    const { pending } = useFormStatus();
    return (
        <button
            {...props}
            type="submit"
            disabled={disabled || pending}
            aria-busy={pending}
        >
            {pending && <span className="loading-spinner" aria-hidden="true" />}
            {pending ? pendingText : children}
        </button>
    );
}
