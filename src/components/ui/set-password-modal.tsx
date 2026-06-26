"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  hasPassword: boolean
}

type ModalStep = "form" | "success"

export function SetPasswordModal({ isOpen, onClose, userEmail, hasPassword }: SetPasswordModalProps) {
  const [step, setStep] = useState<ModalStep>("form")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("form")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setError("")
      setLoading(false)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 6) return "Password must be at least 6 characters"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate new password
    const pwError = validatePassword(newPassword)
    if (pwError) {
      setError(pwError)
      return
    }

    // Confirm passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Same as current password
    if (hasPassword && newPassword === currentPassword) {
      setError("New password must be different from current password")
      return
    }

    setLoading(true)

    try {
      // For email users, verify current password first
      if (hasPassword && currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword,
        })
        if (signInError) {
          setError("Current password is incorrect")
          setLoading(false)
          return
        }
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError("Failed to update password. Please try again.")
        setLoading(false)
        return
      }

      setStep("success")
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = (pw: string): { score: number; label: string; color: string } => {
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    if (score <= 1) return { score, label: "Weak", color: "#EF4444" }
    if (score <= 2) return { score, label: "Fair", color: "#F59E0B" }
    if (score <= 3) return { score, label: "Good", color: "#10B981" }
    return { score, label: "Strong", color: "#10B981" }
  }

  const strength = passwordStrength(newPassword)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-[#171612] border border-[rgba(255,255,255,0.06)] shadow-2xl overflow-hidden"
          >
            {step === "form" ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D97757]/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-[#D97757]" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-serif text-[#F6F3EE]">
                        {hasPassword ? "Change Password" : "Set Password"}
                      </h3>
                      <p className="text-[12px] text-[#BEB7AC]/60 mt-0.5">
                        {hasPassword ? "Update your account password" : "Add a password to your account"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#BEB7AC]/60 hover:text-[#F6F3EE] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Current Password (only for email users) */}
                  {hasPassword && (
                    <div>
                      <label className="block text-[13px] text-[#BEB7AC] mb-1.5">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          required
                          className="w-full h-11 px-4 pr-11 rounded-xl bg-[#1D1C17] border border-[rgba(255,255,255,0.06)] text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/30 focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BEB7AC]/40 hover:text-[#BEB7AC]/70 transition-colors cursor-pointer"
                        >
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="block text-[13px] text-[#BEB7AC] mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="w-full h-11 px-4 pr-11 rounded-xl bg-[#1D1C17] border border-[rgba(255,255,255,0.06)] text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/30 focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BEB7AC]/40 hover:text-[#BEB7AC]/70 transition-colors cursor-pointer"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {newPassword.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex gap-1 flex-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className="h-1 flex-1 rounded-full transition-colors duration-300"
                                style={{
                                  background: i <= strength.score ? strength.color : "rgba(255,255,255,0.06)",
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-medium" style={{ color: strength.color }}>
                            {strength.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[13px] text-[#BEB7AC] mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        className="w-full h-11 px-4 pr-11 rounded-xl bg-[#1D1C17] border border-[rgba(255,255,255,0.06)] text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/30 focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BEB7AC]/40 hover:text-[#BEB7AC]/70 transition-colors cursor-pointer"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-red-400 mt-1.5">Passwords do not match</p>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-[13px] text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-11 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#BEB7AC] text-[14px] font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || (hasPassword && !currentPassword) || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="flex-1 h-11 rounded-xl bg-[#D97757] hover:bg-[#c66a4c] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        hasPassword ? "Update Password" : "Set Password"
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success Step */
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle className="w-8 h-8 text-[#10B981]" />
                </motion.div>
                <h3 className="text-[20px] font-serif text-[#F6F3EE] mb-2">
                  {hasPassword ? "Password Updated" : "Password Set"}
                </h3>
                <p className="text-[14px] text-[#BEB7AC] mb-6">
                  Your password has been {hasPassword ? "updated" : "set"} successfully. You can now sign in with your new password.
                </p>
                <button
                  onClick={onClose}
                  className="w-full h-11 rounded-xl bg-[#D97757] hover:bg-[#c66a4c] text-white text-[14px] font-medium transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
