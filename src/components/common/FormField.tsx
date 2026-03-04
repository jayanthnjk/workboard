import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({ label, error, required, children, className }: FormFieldProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      <label className="label">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-error-500">{error}</p>}
    </div>
  )
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx('input', error && 'input-error', className)}
        {...props}
      />
    )
  }
)
TextInput.displayName = 'TextInput'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={clsx('input min-h-[100px]', error && 'input-error', className)}
        {...props}
      />
    )
  }
)
TextArea.displayName = 'TextArea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, options, placeholder, className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={clsx('input', error && 'input-error', className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }
)
Select.displayName = 'Select'

interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: { value: string; label: string }[]
  placeholder?: string
  error?: boolean
  className?: string
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Select options...',
  error,
  className,
}: MultiSelectProps) {
  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  return (
    <div className={clsx('space-y-2', className)}>
      <div className={clsx('input min-h-[42px] flex flex-wrap gap-1', error && 'input-error')}>
        {value.length === 0 ? (
          <span className="text-neutral-400">{placeholder}</span>
        ) : (
          value.map(v => {
            const opt = options.find(o => o.value === v)
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-sm"
              >
                {opt?.label || v}
                <button
                  type="button"
                  onClick={() => toggleOption(v)}
                  className="hover:text-primary-900 dark:hover:text-primary-100"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )
          })
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options
          .filter(opt => !value.includes(opt.value))
          .map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              className="px-2 py-1 text-sm bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded transition-colors"
            >
              + {opt.label}
            </button>
          ))}
      </div>
    </div>
  )
}

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        className={clsx('input', error && 'input-error', className)}
        {...props}
      />
    )
  }
)
DatePicker.displayName = 'DatePicker'

interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="time"
        className={clsx('input', error && 'input-error', className)}
        {...props}
      />
    )
  }
)
TimePicker.displayName = 'TimePicker'

export default FormField
