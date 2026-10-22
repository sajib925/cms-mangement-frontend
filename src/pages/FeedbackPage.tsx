"use client"

import { useState } from "react"
import { Send, Star, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface FormData {
  userName: string
  email: string
  subject: string
  rating: number
  message: string
}

interface FormErrors {
  userName?: string
  email?: string
  subject?: string
  rating?: string
  message?: string
}

const API_URL = `${import.meta.env.VITE_DATA_ADMIN_URL}/public/feedback`

export default function FeedbackPage() {
  const [form, setForm] = useState<FormData>({
    userName: "",
    email: "",
    subject: "",
    rating: 0,
    message: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!form.userName.trim()) {
      newErrors.userName = "Name is required"
    } else if (form.userName.trim().length < 2) {
      newErrors.userName = "Name must be at least 2 characters"
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Invalid email address"
    }

    if (!form.subject.trim()) {
      newErrors.subject = "Subject is required"
    }

    if (!form.rating) {
      newErrors.rating = "Please select a rating"
    }

    if (!form.message.trim()) {
      newErrors.message = "Feedback is required"
    } else if (form.message.trim().length < 10) {
      newErrors.message = "Feedback must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleRating = (rating: number) => {
    setForm((prev) => ({
      ...prev,
      rating,
    }))

    setErrors((prev) => ({
      ...prev,
      rating: undefined,
    }))
  }

  const handleSubmit = async () => {
    if (!validate() || loading) return

    setLoading(true)

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appName: "Webflow Dev Kit",
          userName: form.userName.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          rating: form.rating,
          message: form.message.trim(),
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to submit feedback. Please try again."
        )
      }

      toast.success("Thank you! Your feedback has been submitted.")

      setForm({
        userName: "",
        email: "",
        subject: "",
        rating: 0,
        message: "",
      })

      setErrors({})
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit feedback. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-2">

        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Share Your Feedback
          </h1>
          <p className="text-xs text-muted-foreground">
            Help us improve Dev Kit with your suggestions and feedback.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="feedback-name"
                className="block text-[11px] font-medium text-foreground/90"
              >
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                id="feedback-name"
                name="userName"
                value={form.userName}
                onChange={handleChange}
                placeholder="John Doe"
                autoComplete="name"
                className="h-8 rounded-lg border-border/60 bg-background/50 text-xs focus-visible:ring-1 focus-visible:ring-blue-500/50"
              />
              {errors.userName && (
                <p className="text-[10px] text-red-400">{errors.userName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="feedback-email"
                className="block text-[11px] font-medium text-foreground/90"
              >
                Email <span className="text-red-400">*</span>
              </label>
              <Input
                id="feedback-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                autoComplete="email"
                className="h-8 rounded-lg border-border/60 bg-background/50 text-xs focus-visible:ring-1 focus-visible:ring-blue-500/50"
              />
              {errors.email && (
                <p className="text-[10px] text-red-400">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="feedback-subject"
              className="block text-[11px] font-medium text-foreground/90"
            >
              Subject <span className="text-red-400">*</span>
            </label>
            <Input
              id="feedback-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Feature request, Bug report, Suggestion..."
              className="h-8 rounded-lg border-border/60 bg-background/50 text-xs focus-visible:ring-1 focus-visible:ring-blue-500/50"
            />
            {errors.subject && (
              <p className="text-[10px] text-red-400">{errors.subject}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-foreground/90">
              Rating <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= form.rating
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRating(star)}
                    className={`flex size-7 cursor-pointer items-center justify-center rounded-md border transition-all duration-150 ${
                      active
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400 scale-105"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-amber-500/30 hover:text-amber-300"
                    }`}
                  >
                    <Star
                      className={`size-3.5 ${
                        active ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                  </button>
                )
              })}
            </div>
            {errors.rating && (
              <p className="text-[10px] text-red-400">{errors.rating}</p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="feedback-message"
              className="block text-[11px] font-medium text-foreground/90"
            >
              Feedback <span className="text-red-400">*</span>
            </label>
            <Textarea
              id="feedback-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us about your experience or suggestion..."
              rows={3}
              className="min-h-20 resize-none rounded-lg border-border/60 bg-background/50 text-xs focus-visible:ring-1 focus-visible:ring-blue-500/50"
            />
            {errors.message && (
              <p className="text-[10px] text-red-400">{errors.message}</p>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="h-8.5 w-full cursor-pointer rounded-lg bg-blue-600 text-xs font-medium text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" />
            ) : (
              <Send className="mr-2 size-3.5" />
            )}
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </div>
    </div>
  )
}