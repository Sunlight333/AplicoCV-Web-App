import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const baseField =
  'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 transition-colors focus:outline-none focus:ring-2 focus:ring-electric-400'

function FieldError({ error }: { error?: string }) {
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden text-xs font-medium text-red-600"
        >
          <span className="block pt-1">{error}</span>
        </motion.p>
      )}
    </AnimatePresence>
  )
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-navy-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(baseField, error ? 'border-red-400' : 'border-navy-200', className)}
        {...props}
      />
      <FieldError error={error} />
    </div>
  ),
)
Input.displayName = 'Input'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-navy-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(baseField, 'resize-y', error ? 'border-red-400' : 'border-navy-200', className)}
        {...props}
      />
      <FieldError error={error} />
    </div>
  ),
)
TextArea.displayName = 'TextArea'
