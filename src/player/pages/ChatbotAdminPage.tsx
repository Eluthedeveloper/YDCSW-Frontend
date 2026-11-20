import { useState } from 'react';
import { toast } from 'sonner';
import {
  Bot, Plus, Pencil, Trash2, RefreshCw, Database, BarChart3, MessageSquareText,
  Settings2, Loader2, Check, X, AlertCircle,
} from 'lucide-react';
import { api } from '../utils/api';
import { errorMessage } from '../utils/errors';
import { useAsyncData } from '../hooks/useAsyncData';
import type {
  ChatLang, ChatbotInput, ChatbotKnowledge, ChatbotSettings,
} from '../utils/types';

type Tab = 'knowledge' | 'analytics' | 'conversations' | 'settings' | 'sync';

const LANGS: ChatLang[] = ['en', 'am', 'om'];

const inputClass =
  'w-full px-3 py-2 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600';
const labelClass = 'block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5';
const primaryButton =
  'flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50';
const dangerButton =
  'p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition';

const EMPTY_FORM: ChatbotInput = {
  intent_id: null,
  language: 'en',
  question: '',
  alternative_questions: [],
  keywords: [],
  answer: '',
  priority: 0,
  is_active: true,
  sync_status: 'approved',
};

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white text-dark-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 dark:hover:bg-dark-500 hover:bg-light-300" aria-label="Close dialog">
            <X size={18} className="dark:text-white text-dark-900" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ChatbotAdminPage() {
  const [tab, setTab] = useState<Tab>('knowledge');
  const [filters, setFilters] = useState<{ lang: ChatLang | ''; intent: string; search: string }>({
    lang: '', intent: '', search: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChatbotInput>(EMPTY_FORM);
  const [alternatives, setAlternatives] = useState('');
  const [keywords, setKeywords] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const knowledge = useAsyncData<ChatbotKnowledge[]>(
    () => api.getChatbotKnowledge({
      lang: filters.lang || undefined,
      intent: filters.intent || undefined,
      search: filters.search || undefined,
    }),
    [],
    [filters.lang, filters.intent, filters.search]
  );
  const intents = useAsyncData(() => api.getChatbotIntents(), []);
  const analytics = useAsyncData(() => api.getChatbotAnalytics(), null);
  const unanswered = useAsyncData(() => api.getChatbotUnanswered(), []);
  const conversations = useAsyncData(() => api.getChatbotConversations(), []);
  const settings = useAsyncData<ChatbotSettings | null>(() => api.getChatbotSettings(), null);
  const sync = useAsyncData(() => api.getChatbotSyncStatus(), { sources: [] });
  const detail = useAsyncData(
    () => selectedId ? api.getChatbotConversation(selectedId) : Promise.resolve(null),
    null,
    [selectedId]
  );

  const settingsForm = settings.data;

  const refreshAll = () => {
    knowledge.reload();
    analytics.reload();
    unanswered.reload();
    conversations.reload();
    sync.reload();
  };

  const openCreate = (question = '') => {
    setForm({ ...EMPTY_FORM, question });
    setAlternatives('');
    setKeywords('');
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (entry: ChatbotKnowledge) => {
    setForm({
      intent_id: entry.intent_id,
      language: entry.language,
      question: entry.question,
      alternative_questions: parseList(entry.alternative_questions),
      keywords: parseList(entry.keywords),
      answer: entry.answer,
      priority: entry.priority,
      is_active: entry.is_active === 1,
      sync_status: entry.sync_status,
    });
    setAlternatives(parseList(entry.alternative_questions).join('\n'));
    setKeywords(parseList(entry.keywords).join('\n'));
    setEditingId(entry.id);
    setShowForm(true);
  };

  const saveKnowledge = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: ChatbotInput = {
        ...form,
        alternative_questions: alternatives.split('\n').map((item) => item.trim()).filter(Boolean),
        keywords: keywords.split('\n').map((item) => item.trim()).filter(Boolean),
      };
      if (editingId) {
        await api.updateChatbotKnowledge(editingId, payload);
        toast.success('Knowledge entry updated');
      } else {
        await api.createChatbotKnowledge(payload);
        toast.success('Knowledge entry added');
      }
      setShowForm(false);
      refreshAll();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save knowledge entry'));
    } finally {
      setSaving(false);
    }
  };

  const removeKnowledge = async (entry: ChatbotKnowledge) => {
    if (!window.confirm(`Delete “${entry.question}”?`)) return;
    try {
      await api.deleteChatbotKnowledge(entry.id);
      toast.success('Knowledge entry deleted');
      refreshAll();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to delete entry'));
    }
  };

  const approve = async (entry: ChatbotKnowledge) => {
    try {
      await api.updateChatbotKnowledge(entry.id, { sync_status: 'approved' });
      toast.success('Entry approved');
      refreshAll();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to approve entry'));
    }
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settingsForm) return;
    setSaving(true);
    try {
      const updated = await api.updateChatbotSettings(settingsForm);
      settings.setData(updated);
      toast.success('Chatbot settings saved');
      settings.reload();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const runSync = async (table?: string) => {
    try {
      const result = await api.runChatbotSync(table);
      toast.success(`Synced ${result.synced} content entries`);
      refreshAll();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Content sync failed'));
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof Bot }> = [
    { id: 'knowledge', label: 'Knowledge', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'conversations', label: 'Conversations', icon: MessageSquareText },
    { id: 'settings', label: 'Settings', icon: Settings2 },
    { id: 'sync', label: 'Content sync', icon: RefreshCw },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold dark:text-white text-dark-900">
            <Bot size={24} className="text-primary-500" /> Chatbot Knowledge
          </h1>
          <p className="mt-1 text-sm dark:text-dark-200 text-dark-600">
            Multilingual answers, visitor questions, and automatic website-content sync.
          </p>
        </div>
        <button onClick={() => openCreate()} className={primaryButton}>
          <Plus size={16} /> Add answer
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              tab === item.id
                ? 'bg-primary-600 text-white'
                : 'glass-panel dark:text-dark-100 text-dark-700 hover:bg-primary-600/10'
            }`}
          >
            <item.icon size={15} /> {item.label}
          </button>
        ))}
      </div>

      {tab === 'knowledge' && (
        <div className="space-y-4">
          <div className="glass-panel flex flex-wrap gap-3 rounded-xl p-4">
            <input
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search questions or answers"
              className={`${inputClass} min-w-[200px] flex-1`}
            />
            <select
              value={filters.lang}
              onChange={(event) => setFilters((prev) => ({ ...prev, lang: event.target.value as ChatLang | '' }))}
              className={inputClass}
            >
              <option value="">All languages</option>
              {LANGS.map((lang) => <option key={lang} value={lang}>{lang.toUpperCase()}</option>)}
            </select>
            <select
              value={filters.intent}
              onChange={(event) => setFilters((prev) => ({ ...prev, intent: event.target.value }))}
              className={inputClass}
            >
              <option value="">All intents</option>
              {(intents.data ?? []).map((intent) => (
                <option key={intent.id} value={intent.name}>{intent.name}</option>
              ))}
            </select>
          </div>

          {knowledge.error && <p className="text-sm text-red-500">{knowledge.error}</p>}
          <div className="glass-panel overflow-x-auto rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide dark:text-dark-200 text-dark-600">
                <tr>
                  <th className="p-3">Question</th>
                  <th className="p-3">Language</th>
                  <th className="p-3">Intent</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {knowledge.data.map((entry) => (
                  <tr key={entry.id} className="border-t border-white/5 align-top">
                    <td className="max-w-md p-3 dark:text-white text-dark-900">
                      <p className="font-medium">{entry.question}</p>
                      <p className="mt-1 line-clamp-2 text-xs dark:text-dark-200 text-dark-600">{entry.answer}</p>
                    </td>
                    <td className="p-3 uppercase">{entry.language}</td>
                    <td className="p-3">{entry.intent_name ?? '—'}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        entry.source_type === 'content_sync' ? 'bg-blue-500/15 text-blue-400' : 'bg-primary-600/15 text-primary-400'
                      }`}>
                        {entry.source_type === 'content_sync' ? 'Website' : 'Manual'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        entry.sync_status === 'approved' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {entry.sync_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {entry.sync_status !== 'approved' && (
                          <button onClick={() => approve(entry)} title="Approve" className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                            <Check size={16} />
                          </button>
                        )}
                        <button onClick={() => openEdit(entry)} title="Edit" className="p-1.5 rounded-lg hover:bg-primary-600/10">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => removeKnowledge(entry)} title="Delete" className={dangerButton}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!knowledge.loading && knowledge.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center dark:text-dark-200 text-dark-600">
                      No knowledge entries match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-4">
          {analytics.data?.totals && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ['Conversations', analytics.data.totals.conversations],
                ['Questions', analytics.data.totals.questions],
                ['Answered', analytics.data.totals.answered],
                ['Unanswered', analytics.data.totals.unanswered],
                ['Success rate', `${analytics.data.totals.successRate}%`],
              ].map(([label, value]) => (
                <div key={String(label)} className="glass-panel rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide dark:text-dark-200 text-dark-600">{label}</p>
                  <p className="mt-1 text-2xl font-bold dark:text-white text-dark-900">{value}</p>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-panel rounded-xl p-4">
              <h2 className="mb-3 font-semibold dark:text-white text-dark-900">Top visitor questions</h2>
              <ul className="space-y-2 text-sm">
                {(analytics.data?.topQuestions ?? []).map((row) => (
                  <li key={row.question} className="flex justify-between gap-3">
                    <span className="dark:text-dark-100 text-dark-700">{row.question}</span>
                    <span className="dark:text-dark-200 text-dark-600">{row.count}</span>
                  </li>
                ))}
                {!analytics.data?.topQuestions.length && <li className="text-sm dark:text-dark-200">No questions yet.</li>}
              </ul>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <h2 className="mb-3 font-semibold dark:text-white text-dark-900">Unanswered questions</h2>
              <ul className="space-y-2 text-sm">
                {unanswered.data.slice(0, 10).map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="dark:text-dark-100 text-dark-700">{row.message}</p>
                      <p className="text-xs dark:text-dark-300 text-dark-500">{row.language} · {formatDate(row.created_at)}</p>
                    </div>
                    <button onClick={() => openCreate(row.message)} className="text-xs text-primary-400 hover:underline">
                      Add answer
                    </button>
                  </li>
                ))}
                {unanswered.data.length === 0 && <li className="text-sm dark:text-dark-200">Nothing unanswered.</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'conversations' && (
        <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
          <div className="glass-panel overflow-hidden rounded-xl">
            <div className="border-b border-white/5 p-3 text-sm font-semibold dark:text-white text-dark-900">
              Recent conversations
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {conversations.data.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full border-b border-white/5 p-3 text-left text-sm transition hover:bg-primary-600/10 ${
                    selectedId === conversation.id ? 'bg-primary-600/15' : ''
                  }`}
                >
                  <p className="font-medium dark:text-white text-dark-900">{conversation.session_id}</p>
                  <p className="text-xs dark:text-dark-200 text-dark-600">
                    {conversation.language.toUpperCase()} · {conversation.message_count} messages · {conversation.unanswered} unanswered
                  </p>
                  <p className="text-xs dark:text-dark-300 text-dark-500">{formatDate(conversation.last_activity)}</p>
                </button>
              ))}
              {conversations.data.length === 0 && <p className="p-4 text-sm dark:text-dark-200">No conversations yet.</p>}
            </div>
          </div>
          <div className="glass-panel min-h-[300px] rounded-xl p-4">
            <h2 className="mb-3 font-semibold dark:text-white text-dark-900">Conversation detail</h2>
            {!selectedId && <p className="text-sm dark:text-dark-200">Select a conversation to read it.</p>}
            {detail.loading && <Loader2 className="animate-spin text-primary-400" size={20} />}
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              {(detail.data?.messages ?? []).map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    message.sender === 'visitor'
                      ? 'ml-auto max-w-[85%] bg-primary-600 text-white'
                      : 'mr-auto max-w-[85%] dark:bg-dark-600 bg-light-200 dark:text-white text-dark-900'
                  }`}
                >
                  {message.message}
                  {message.sender === 'bot' && message.matched_knowledge_id === null && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                      <AlertCircle size={12} /> Unanswered
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && settingsForm && (
        <form onSubmit={saveSettings} className="glass-panel space-y-4 rounded-xl p-5">
          <h2 className="font-semibold dark:text-white text-dark-900">Matching &amp; languages</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Confidence threshold (0–1)</label>
              <input
                type="number" step="0.01" min="0.05" max="1" value={settingsForm.confidence_threshold}
                onChange={(event) => settings.setData({ ...settingsForm, confidence_threshold: Number(event.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fuzzy threshold (0–1)</label>
              <input
                type="number" step="0.01" min="0.05" max="1" value={settingsForm.fuzzy_threshold}
                onChange={(event) => settings.setData({ ...settingsForm, fuzzy_threshold: Number(event.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sync interval (minutes)</label>
              <input
                type="number" min="1" value={settingsForm.sync_interval_minutes}
                onChange={(event) => settings.setData({ ...settingsForm, sync_interval_minutes: Number(event.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max history turns</label>
              <input
                type="number" min="1" value={settingsForm.max_history_turns}
                onChange={(event) => settings.setData({ ...settingsForm, max_history_turns: Number(event.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <p className={labelClass}>Enabled languages</p>
            <div className="flex gap-4">
              {LANGS.map((lang) => (
                <label key={lang} className="flex items-center gap-2 text-sm dark:text-dark-100 text-dark-700">
                  <input
                    type="checkbox"
                    checked={(settingsForm.enabled_languages ?? []).includes(lang)}
                    onChange={(event) => settings.setData({
                      ...settingsForm,
                      enabled_languages: event.target.checked
                        ? [...(settingsForm.enabled_languages ?? []), lang]
                        : (settingsForm.enabled_languages ?? []).filter((item) => item !== lang),
                    })}
                  />
                  {lang.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm dark:text-dark-100 text-dark-700">
            <input
              type="checkbox"
              checked={settingsForm.auto_approve_content}
              onChange={(event) => settings.setData({ ...settingsForm, auto_approve_content: event.target.checked })}
            />
            Auto-approve synced website content
          </label>

          {LANGS.map((lang) => (
            <div key={lang} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Welcome message — {lang.toUpperCase()}</label>
                <textarea
                  rows={2}
                  value={settingsForm.welcome_messages?.[lang] ?? ''}
                  onChange={(event) => settings.setData({
                    ...settingsForm,
                    welcome_messages: { ...(settingsForm.welcome_messages ?? {}), [lang]: event.target.value },
                  })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Fallback message — {lang.toUpperCase()}</label>
                <textarea
                  rows={2}
                  value={settingsForm.fallback_messages?.[lang] ?? ''}
                  onChange={(event) => settings.setData({
                    ...settingsForm,
                    fallback_messages: { ...(settingsForm.fallback_messages ?? {}), [lang]: event.target.value },
                  })}
                  className={inputClass}
                />
              </div>
            </div>
          ))}

          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save settings
          </button>
        </form>
      )}

      {tab === 'sync' && (
        <div className="space-y-4">
          <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
            <div>
              <h2 className="font-semibold dark:text-white text-dark-900">Website content sync</h2>
              <p className="text-sm dark:text-dark-200 text-dark-600">
                Published programs, announcements, events, articles and media become searchable answers.
              </p>
            </div>
            <button onClick={() => runSync()} className={primaryButton}>
              <RefreshCw size={16} /> Sync all now
            </button>
          </div>
          <div className="glass-panel overflow-x-auto rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase dark:text-dark-200 text-dark-600">
                <tr>
                  <th className="p-3">Source</th>
                  <th className="p-3">Content ID</th>
                  <th className="p-3">Language</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last synced</th>
                  <th className="p-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {(sync.data.sources ?? []).map((source, index) => (
                  <tr key={`${source.source_table}-${source.source_id}-${index}`} className="border-t border-white/5">
                    <td className="p-3 dark:text-white text-dark-900">{source.source_table}</td>
                    <td className="p-3 text-xs">{source.source_id}</td>
                    <td className="p-3 uppercase">{source.language}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        source.status === 'failed' ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'
                      }`}>{source.status}</span>
                    </td>
                    <td className="p-3 text-xs">{formatDate(source.last_synced_at)}</td>
                    <td className="p-3 text-xs text-amber-400">{source.last_error ?? '—'}</td>
                  </tr>
                ))}
                {sync.data.sources.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center dark:text-dark-200">No synced content yet. Run a sync.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit knowledge entry' : 'Add knowledge entry'} onClose={() => setShowForm(false)}>
          <form onSubmit={saveKnowledge} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Language</label>
                <select
                  value={form.language}
                  onChange={(event) => setForm({ ...form, language: event.target.value as ChatLang })}
                  className={inputClass}
                >
                  {LANGS.map((lang) => <option key={lang} value={lang}>{lang.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Intent</label>
                <select
                  value={form.intent_id ?? ''}
                  onChange={(event) => setForm({ ...form, intent_id: event.target.value || null })}
                  className={inputClass}
                >
                  <option value="">Uncategorised</option>
                  {(intents.data ?? []).map((intent) => (
                    <option key={intent.id} value={intent.id}>{intent.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Question</label>
              <input
                required maxLength={500} value={form.question}
                onChange={(event) => setForm({ ...form, question: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Alternative questions (one per line)</label>
              <textarea
                rows={3} value={alternatives}
                onChange={(event) => setAlternatives(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Keywords (one per line)</label>
              <textarea
                rows={3} value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Answer</label>
              <textarea
                required rows={5} value={form.answer}
                onChange={(event) => setForm({ ...form, answer: event.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={labelClass}>Priority</label>
                <input
                  type="number" value={form.priority}
                  onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={form.sync_status}
                  onChange={(event) => setForm({ ...form, sync_status: event.target.value as ChatbotInput['sync_status'] })}
                  className={inputClass}
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm dark:text-dark-100 text-dark-700">
                <input
                  type="checkbox" checked={form.is_active}
                  onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className={primaryButton}>
                <X size={16} /> Cancel
              </button>
              <button type="submit" disabled={saving} className={primaryButton}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {editingId ? 'Save changes' : 'Add entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
