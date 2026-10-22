import React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "success" | "warning"
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      icon,
      iconPosition = "left",
      loading = false,
      loadingText,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"

    const variantStyles = {
      primary: "bg-[#006acc] text-white hover:bg-[#0055aa]",
      secondary: "bg-gray-700 text-white hover:bg-gray-600",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      ghost: "bg-transparent text-foreground hover:bg-muted",
      success: "bg-green-600 text-white hover:bg-green-700",
      warning: "bg-yellow-600 text-white hover:bg-yellow-700",
    }

    const content = (
      <>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && icon && iconPosition === "left" && icon}
        {loading && loadingText ? loadingText : children}
        {!loading && icon && iconPosition === "right" && icon}
      </>
    )

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = "Button"

export default Button
