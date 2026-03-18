import React, { useState, useMemo } from 'react'
import {
  ArrowLeft, Search, Plus, Zap, Check, X,
  ShoppingCart, BookOpen, Table, FileEdit, Shuffle,
  Bookmark, Bell, Layers, BookmarkPlus, Save, Camera, FileText,
} from 'lucide-react'
import type { Skill, SkillCategory } from '../../shared/types'
import { BUILT_IN_SKILLS, SKILL_CATEGORIES } from '../../shared/skills'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  ShoppingCart, BookOpen, Table, FileEdit, Shuffle,
  Bookmark, Bell, Layers, BookmarkPlus, Save, Camera, FileText,
}

interface Props {
  onBack: () => void
  onRunSkill?: (skill: Skill) => void
}

function uid(): string {
  return Math.random().toString(36).slice(2, 11)
}

export default function SkillsGallery({ onBack, onRunSkill }: Props) {
  const [skills, setSkills] = useState<Skill[]>(BUILT_IN_SKILLS)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'all'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const filtered = useMemo(() => {
    return skills.filter((skill) => {
      const matchesCategory = activeCategory === 'all' || skill.category === activeCategory
      const matchesSearch = !searchQuery ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [skills, searchQuery, activeCategory])

  const toggleSkill = (id: string) => {
    setSkills((prev) => prev.map((s) => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s))
  }

  const deleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id || s.isBuiltIn))
  }

  const addCustomSkill = (skill: Omit<Skill, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    const newSkill: Skill = {
      ...skill,
      id: uid(),
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
    }
    setSkills((prev) => [...prev, newSkill])
    setShowCreateForm(false)
  }

  const categories = Object.keys(SKILL_CATEGORIES) as SkillCategory[]
  const categoriesWithCounts = categories.filter((c) => skills.some((s) => s.category === c))

  // Skill detail view
  if (selectedSkill) {
    return (
      <SkillDetail
        skill={selectedSkill}
        onBack={() => setSelectedSkill(null)}
        onRun={() => {
          onRunSkill?.(selectedSkill)
          setSelectedSkill(null)
        }}
        onToggle={() => {
          toggleSkill(selectedSkill.id)
          setSelectedSkill((s) => s ? { ...s, isEnabled: !s.isEnabled } : s)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-3 py-3 border-b"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        <button onClick={onBack} className="icon-btn">
          <ArrowLeft size={15} />
        </button>
        <Zap size={15} style={{ color: 'rgb(var(--harbor-accent))' }} />
        <h2 className="font-semibold text-sm flex-1" style={{ color: 'rgb(var(--harbor-text))' }}>
          Skills
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="icon-btn"
          title="Create skill"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
        <div
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border"
          style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-border))' }}
        >
          <Search size={13} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills…"
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'rgb(var(--harbor-text))' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={11} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div
        className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-b"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        <button
          onClick={() => setActiveCategory('all')}
          className={`memory-cat-chip flex-shrink-0 ${activeCategory === 'all' ? 'active' : ''}`}
        >
          All ({skills.length})
        </button>
        {categoriesWithCounts.map((cat) => {
          const meta = SKILL_CATEGORIES[cat]
          const count = skills.filter((s) => s.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`memory-cat-chip flex-shrink-0 ${activeCategory === cat ? 'active' : ''}`}
            >
              {meta.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Skills list */}
      <div className="flex-1 overflow-y-auto harbor-scroll px-3 py-3 flex flex-col gap-2">
        {showCreateForm && (
          <CreateSkillForm
            onSave={addCustomSkill}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {filtered.length === 0 && !showCreateForm && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <Zap size={32} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
            <p className="text-sm" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
              No skills found
            </p>
            <button onClick={() => setShowCreateForm(true)} className="harbor-btn-primary text-xs px-4 py-2">
              <Plus size={13} /> Create skill
            </button>
          </div>
        )}

        {filtered.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            onSelect={() => setSelectedSkill(skill)}
            onToggle={() => toggleSkill(skill.id)}
            onRun={() => onRunSkill?.(skill)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Skill Card ────────────────────────────────────────────────────────────────

function SkillCard({ skill, onSelect, onToggle, onRun }: {
  skill: Skill
  onSelect: () => void
  onToggle: () => void
  onRun: () => void
}) {
  const Icon = ICON_MAP[skill.icon] ?? Zap
  const catMeta = SKILL_CATEGORIES[skill.category]

  return (
    <div
      className="skill-card"
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgb(var(--harbor-accent-light))' }}
        >
          <Icon size={16} style={{ color: 'rgb(var(--harbor-accent))' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>
              {skill.name}
            </span>
            {!skill.isEnabled && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgb(var(--harbor-border))', color: 'rgb(var(--harbor-text-faint))' }}>
                Off
              </span>
            )}
          </div>
          <p className="text-[11px] leading-snug mt-0.5 line-clamp-2" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
            {skill.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5" onClick={(e) => e.stopPropagation()}>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catMeta?.color ?? ''}`}>
          {catMeta?.label}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onRun}
            className="text-[11px] px-2.5 py-1 rounded-lg font-medium"
            style={{ background: 'rgb(var(--harbor-accent))', color: 'white' }}
          >
            Run
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Skill Detail ──────────────────────────────────────────────────────────────

function SkillDetail({ skill, onBack, onRun, onToggle }: {
  skill: Skill
  onBack: () => void
  onRun: () => void
  onToggle: () => void
}) {
  const Icon = ICON_MAP[skill.icon] ?? Zap
  const catMeta = SKILL_CATEGORIES[skill.category]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-3 py-3 border-b" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
        <button onClick={onBack} className="icon-btn">
          <ArrowLeft size={15} />
        </button>
        <h2 className="font-semibold text-sm flex-1" style={{ color: 'rgb(var(--harbor-text))' }}>
          {skill.name}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto harbor-scroll px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgb(var(--harbor-accent-light))' }}
          >
            <Icon size={22} style={{ color: 'rgb(var(--harbor-accent))' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--harbor-text))' }}>{skill.name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catMeta?.color ?? ''}`}>
              {catMeta?.label}
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
          {skill.description}
        </p>

        <div>
          <p className="harbor-section-label mb-2">Instructions</p>
          <div
            className="text-xs leading-relaxed p-3 rounded-xl border font-mono"
            style={{
              background: 'rgb(var(--harbor-surface))',
              borderColor: 'rgb(var(--harbor-border))',
              color: 'rgb(var(--harbor-text))',
              whiteSpace: 'pre-wrap',
            }}
          >
            {skill.instructions}
          </div>
        </div>

        {skill.usageCount !== undefined && skill.usageCount > 0 && (
          <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Used {skill.usageCount} times
          </p>
        )}
      </div>

      <div className="px-3 py-3 border-t flex gap-2" style={{ borderColor: 'rgb(var(--harbor-border))' }}>
        <button onClick={onToggle} className="harbor-btn-ghost flex-shrink-0 px-4">
          {skill.isEnabled ? 'Disable' : 'Enable'}
        </button>
        <button onClick={onRun} className="harbor-btn-primary flex-1">
          <Zap size={13} /> Run skill
        </button>
      </div>
    </div>
  )
}

// ─── Create Skill Form ─────────────────────────────────────────────────────────

function CreateSkillForm({ onSave, onCancel }: {
  onSave: (skill: Omit<Skill, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [category, setCategory] = useState<SkillCategory>('custom')

  const handleSave = () => {
    if (!name.trim() || !instructions.trim()) return
    onSave({
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      category,
      icon: 'Zap',
      isEnabled: true,
    })
  }

  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-3 animate-fade-in"
      style={{ background: 'rgb(var(--harbor-surface))', borderColor: 'rgb(var(--harbor-accent) / 0.3)' }}
    >
      <p className="text-xs font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>Create Custom Skill</p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Skill name"
        className="harbor-input text-xs"
        autoFocus
      />

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description"
        className="harbor-input text-xs"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as SkillCategory)}
        className="harbor-input text-xs"
      >
        {(Object.keys(SKILL_CATEGORIES) as SkillCategory[]).map((cat) => (
          <option key={cat} value={cat}>{SKILL_CATEGORIES[cat].label}</option>
        ))}
      </select>

      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Instructions for Harbor (describe what it should do when running this skill)…"
        className="harbor-input text-xs resize-none min-h-[80px]"
      />

      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={!name.trim() || !instructions.trim()}
          className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40"
          style={{ background: 'rgb(var(--harbor-accent))', color: 'white' }}
        >
          Create
        </button>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ color: 'rgb(var(--harbor-text-muted))' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
