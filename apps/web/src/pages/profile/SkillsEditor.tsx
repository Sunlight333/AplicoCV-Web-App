import { useState, type KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { useT } from '@/i18n/I18nProvider'
import { suggestSkill } from '@/lib/skills'

export function SkillsEditor({
  skills,
  onChange,
}: {
  skills: string[]
  onChange: (skills: string[]) => void
}) {
  const tp = useT().app.profile
  const [input, setInput] = useState('')
  const suggestion = suggestSkill(input)

  const add = (value?: string) => {
    const v = (value ?? input).trim()
    if (v && !skills.includes(v)) onChange([...skills, v])
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    }
    if (e.key === 'Backspace' && !input && skills.length) {
      onChange(skills.slice(0, -1))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-lg border border-navy-200 bg-white p-3 focus-within:ring-2 focus-within:ring-electric-400">
        {skills.map((s) => (
          <Badge key={s} tone="info" className="gap-1">
            {s}
            <button
              onClick={() => onChange(skills.filter((x) => x !== s))}
              className="ml-1 text-electric-500 hover:text-electric-700"
              aria-label={`Remove ${s}`}
            >
              ×
            </button>
          </Badge>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add()}
          placeholder={tp.skillsPlaceholder}
          className="min-w-[180px] flex-1 bg-transparent text-sm outline-none placeholder:text-navy-300"
        />
      </div>
      {suggestion && suggestion.toLowerCase() !== input.trim().toLowerCase() && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => add(suggestion)}
          className="mt-2 inline-flex items-center gap-1 rounded-full border border-electric-300 bg-electric-50 px-3 py-1 text-xs font-medium text-electric-700 hover:bg-electric-100"
        >
          {tp.didYouMean ?? 'Did you mean'} “{suggestion}”?
        </button>
      )}
      <p className="mt-2 text-xs text-navy-400">{tp.skillsHint}</p>
    </div>
  )
}
