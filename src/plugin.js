import {
  Badge,
  Button,
  Codicon,
  GlyphSpinner,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  StatusDot,
  cn,
  host,
  useValue
} from '@hermes/plugin-sdk'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useEffect, useMemo, useState } from 'react'

const ID = 'model-key-switcher'

function modelId(row) {
  return typeof row === 'string' ? row : row?.id || row?.name || ''
}

function errorText(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown error')
}

function desktopApi(path, method = 'GET', body) {
  return window.hermesDesktop.api({ path, method, ...(body ? { body } : {}) })
}

function Section({ title, children, actions }) {
  return jsxs('div', {
    className: 'flex flex-col gap-2.5 rounded-lg border border-(--ui-stroke-secondary) p-3',
    children: [
      jsxs('div', { className: 'flex items-center justify-between gap-2', children: [
        jsx('span', { className: 'text-[0.6875rem] font-medium tracking-wide text-(--ui-text-tertiary)', children: title }),
        actions ? jsx('div', { className: 'flex items-center gap-1', children: actions }) : null
      ] }),
      ...children
    ]
  })
}

function Field({ label, children, hint }) {
  return jsxs('label', {
    className: 'flex flex-col gap-1',
    children: [
      jsx('span', { className: 'text-xs text-(--ui-text-secondary)', children: label }),
      children,
      hint ? jsx('span', { className: 'text-[0.6875rem] text-(--ui-text-tertiary)', children: hint }) : null
    ]
  })
}

function ModelStudio({ onHide }) {
  const profile = useValue(host.state.profile) || 'default'
  const [data, setData] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [provider, setProvider] = useState('')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [reasoning, setReasoning] = useState('medium')
  const [fast, setFast] = useState(false)
  const [message, setMessage] = useState(null)
  const [showKeys, setShowKeys] = useState(false)
  const [revealedKey, setRevealedKey] = useState(null)
  const [poolEntries, setPoolEntries] = useState([])
  const [validation, setValidation] = useState(null)
  const [keyLoading, setKeyLoading] = useState(false)

  const providers = useMemo(() => (data?.providers || []).filter(row => row?.slug), [data])
  const selectedProvider = providers.find(row => row.slug === provider) || null
  const models = (selectedProvider?.models || []).map(modelId).filter(Boolean)

  const providerConfig = useMemo(() => {
    if (!config) return null
    const provs = config.providers || {}
    const slug = provider.replace(/^custom:/, '')
    return provs[slug] || provs[provider] || null
  }, [config, provider])

  const envVar = useMemo(() => {
    if (selectedProvider?.key_env) return selectedProvider.key_env
    if (providerConfig?.key_env) return providerConfig.key_env
    return ''
  }, [selectedProvider, providerConfig])

  const configuredBaseUrl = useMemo(() => {
    if (providerConfig?.api) return providerConfig.api
    if (config?.model?.base_url) return config.model.base_url
    return ''
  }, [providerConfig, config])

  async function load(refresh = false) {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setMessage(null)
    setValidation(null)
    try {
      const [optionsResult, configResult] = await Promise.all([
        host.request('model.options', {
          include_unconfigured: true,
          explicit_only: false,
          ...(refresh ? { refresh: true } : {})
        }),
        desktopApi('/api/config').catch(() => null)
      ])
      setData(optionsResult)
      setConfig(configResult)
      const nextProvider = optionsResult.provider || optionsResult.providers?.find(row => row.is_current)?.slug || optionsResult.providers?.[0]?.slug || ''
      const nextRow = optionsResult.providers?.find(row => row.slug === nextProvider)
      const nextModels = (nextRow?.models || []).map(modelId).filter(Boolean)
      setProvider(nextProvider)
      setModel(optionsResult.model || nextModels[0] || '')
      const slug = nextProvider.replace(/^custom:/, '')
      const provCfg = (configResult?.providers || {})[slug] || (configResult?.providers || {})[nextProvider]
      const cfgUrl = provCfg?.api || configResult?.model?.base_url || ''
      if (cfgUrl) setBaseUrl(prev => prev || cfgUrl)
    } catch (error) {
      setMessage({ kind: 'error', text: errorText(error) })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function loadCredentialHistory() {
    try {
      const result = await desktopApi('/api/credentials/pool')
      const row = (result?.providers || []).find(item => item.provider === provider.replace(/^custom:/, ''))
      setPoolEntries(row?.entries || [])
    } catch {
      setPoolEntries([])
    }
  }

  async function revealCurrentKey() {
    if (!envVar) {
      setRevealedKey(null)
      return
    }
    setKeyLoading(true)
    try {
      const result = await desktopApi('/api/env/reveal', 'POST', { key: envVar })
      setRevealedKey(result?.value || '')
    } catch (error) {
      setRevealedKey(null)
      setValidation({ ok: false, reachable: false, message: errorText(error) })
    } finally {
      setKeyLoading(false)
    }
  }

  async function validateKey() {
    const value = apiKey.trim() || revealedKey || ''
    const key = baseUrl.trim() ? 'OPENAI_BASE_URL' : envVar
    if (!key || !value) {
      setValidation({ ok: false, reachable: true, message: 'أدخل المفتاح أولاً.' })
      return false
    }
    setValidating(true)
    setValidation(null)
    try {
      const result = await desktopApi('/api/providers/validate', 'POST', {
        key,
        value: baseUrl.trim() ? baseUrl.trim() : value,
        api_key: baseUrl.trim() ? value : ''
      })
      setValidation(result)
      return result.ok || !result.reachable
    } catch (error) {
      setValidation({ ok: false, reachable: false, message: errorText(error) })
      return false
    } finally {
      setValidating(false)
    }
  }

  useEffect(() => { void load() }, [profile])

  useEffect(() => {
    setRevealedKey(null)
    setPoolEntries([])
    setValidation(null)
    if (showKeys) {
      void loadCredentialHistory()
      void revealCurrentKey()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showKeys, provider])

  function chooseProvider(next) {
    setProvider(next)
    const row = providers.find(item => item.slug === next)
    const nextModels = (row?.models || []).map(modelId).filter(Boolean)
    if (!nextModels.includes(model)) setModel(nextModels[0] || '')
    const slug = next.replace(/^custom:/, '')
    const provCfg = (config?.providers || {})[slug] || (config?.providers || {})[next]
    setBaseUrl(provCfg?.api || config?.model?.base_url || '')
    setRevealedKey(null)
    setPoolEntries([])
    setValidation(null)
  }

  async function save() {
    if (!provider || !model) {
      setMessage({ kind: 'error', text: 'اختر المزود والموديل أولاً.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      if (apiKey.trim()) {
        const valid = await validateKey()
        if (!valid) {
          setMessage({ kind: 'error', text: 'تم إيقاف الحفظ: فحص API key لم ينجح.' })
          return
        }
        await host.request('model.save_key', { slug: provider, api_key: apiKey.trim() })
      }
      const result = await desktopApi('/api/model/set', 'POST', {
        scope: 'main',
        provider,
        model,
        base_url: baseUrl.trim(),
        api_key: provider === 'custom' ? apiKey.trim() : ''
      })
      await host.request('config.set', { key: 'reasoning', value: reasoning, scope: 'global' }).catch(() => undefined)
      await host.request('config.set', { key: 'fast', value: fast ? 'fast' : 'normal', scope: 'global' }).catch(() => undefined)
      setApiKey('')
      setRevealedKey(null)
      setMessage({ kind: 'ok', text: `تم تطبيق ${result?.model || model} عبر ${result?.provider || provider}.` })
      await load(true)
      if (showKeys) await loadCredentialHistory()
    } catch (error) {
      setMessage({ kind: 'error', text: errorText(error) })
    } finally {
      setSaving(false)
    }
  }

  async function disconnect() {
    if (!provider) return
    setSaving(true)
    setMessage(null)
    try {
      await host.request('model.disconnect', { slug: provider })
      setRevealedKey(null)
      setPoolEntries([])
      setMessage({ kind: 'ok', text: `تم حذف اعتماد ${provider}.` })
      await load(true)
    } catch (error) {
      setMessage({ kind: 'error', text: errorText(error) })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return jsx('div', { className: 'flex h-full items-center justify-center p-4', children: jsx(GlyphSpinner, { spinner: 'breathe' }) })
  }

  const authenticated = Boolean(selectedProvider?.authenticated)

  return jsxs('div', {
    dir: 'rtl',
    className: 'flex h-full flex-col gap-3 overflow-auto p-3 text-sm',
    children: [
      jsxs('div', { className: 'flex items-center justify-between gap-2', children: [
        jsxs('div', { className: 'flex items-center gap-2', children: [
          jsx('span', { className: 'text-sm font-medium', children: 'استوديو المودل' }),
          jsx(StatusDot, { tone: authenticated ? 'ok' : 'warn', title: authenticated ? 'مفتاح محفوظ' : 'بدون مفتاح' }),
          jsx(Badge, { variant: 'outline', children: profile })
        ] }),
        jsxs('div', { className: 'flex items-center gap-1', children: [
          jsx(Button, { size: 'sm', variant: 'ghost', disabled: refreshing, onClick: () => void load(true), children: jsx(Codicon, { name: 'refresh', size: '0.8rem' }) }),
          jsx(Button, { size: 'sm', variant: 'ghost', onClick: onHide, children: jsx(Codicon, { name: 'close', size: '0.8rem' }) })
        ] })
      ] }),

      message ? jsx('div', { className: cn('rounded-md border px-2.5 py-1.5 text-xs', message.kind === 'error' ? 'border-red-500/40 text-red-400' : 'border-green-500/40 text-green-400'), children: message.text }) : null,

      jsxs(Section, { title: 'الاتصال', children: [
        jsx(Field, { label: 'المزود', children: jsx(Select, { value: provider, onValueChange: chooseProvider, children: jsxs(SelectTrigger, { className: 'h-8', children: [jsx(SelectValue, { placeholder: 'اختر المزود' }), jsx(SelectContent, { children: providers.map(row => jsx(SelectItem, { value: row.slug, children: `${row.name || row.slug}${row.authenticated ? ' ✓' : ''}` }, row.slug)) })] }) }) }),
        jsx(Field, { label: 'الموديل', children: models.length ? jsx(Select, { value: model, onValueChange: setModel, children: jsxs(SelectTrigger, { className: 'h-8', children: [jsx(SelectValue, { placeholder: 'اختر الموديل' }), jsx(SelectContent, { children: models.map(item => jsx(SelectItem, { value: item, children: item }, item)) })] }) }) : jsx(Input, { className: 'h-8', value: model, onChange: event => setModel(event.target.value), placeholder: 'اسم الموديل' }) }),
        jsx(Field, { label: 'Base URL', hint: configuredBaseUrl ? `من الإعدادات: ${configuredBaseUrl}` : 'اختياري — لـ endpoints متوافقة مع OpenAI', children: jsx(Input, { className: 'h-8', value: baseUrl, onChange: event => setBaseUrl(event.target.value), placeholder: configuredBaseUrl || 'https://example.com/v1' }) })
      ] }),

      jsxs(Section, {
        title: 'المفتاح',
        actions: [
          jsx(Button, { key: 'check', size: 'sm', variant: 'ghost', disabled: validating, onClick: () => void validateKey(), children: validating ? '...' : 'فحص' }),
          jsx(Button, { key: 'reveal', size: 'sm', variant: 'ghost', disabled: keyLoading || !envVar, onClick: () => setShowKeys(prev => !prev), children: showKeys ? 'إخفاء' : 'كشف' })
        ],
        children: [
          jsx(Input, { className: 'h-8', type: 'password', value: apiKey, onChange: event => setApiKey(event.target.value), placeholder: apiKey ? 'مفتاح محفوظ — اكتب بديلاً فقط' : 'الصق مفتاحاً جديداً (اختياري)' }),
          validation ? jsx('div', { className: cn('rounded-md border px-2 py-1 text-[0.6875rem]', validation.ok ? 'border-green-500/40 text-green-400' : 'border-red-500/40 text-red-400'), children: validation.ok ? `✅ صالح${validation.message ? ` — ${validation.message}` : ''}` : `❌ ${validation.message || 'غير صالح'}` }) : null,
          showKeys ? jsxs('div', { className: 'flex flex-col gap-1.5 rounded-md bg-(--ui-stroke-secondary)/20 p-2', children: [
            jsx('div', { className: 'text-[0.6875rem] text-(--ui-text-tertiary)', children: envVar || 'لا يوجد متغير API key لهذا المزود.' }),
            revealedKey !== null ? jsx('code', { className: 'break-all rounded bg-(--ui-stroke-secondary)/30 px-2 py-1 text-[0.6875rem]', children: revealedKey }) : null,
            poolEntries.length ? jsxs('div', { className: 'flex flex-col gap-1', children: [
              jsx('span', { className: 'text-[0.6875rem] text-(--ui-text-secondary)', children: 'السوابق:' }),
              ...poolEntries.map(entry => jsx('div', { className: 'rounded bg-(--ui-stroke-secondary)/20 px-2 py-0.5 text-[0.6875rem] text-(--ui-text-tertiary)', children: `${entry.label || entry.id} — ${entry.token_preview || '(بدون معاينة)'}${entry.last_status ? ` [${entry.last_status}]` : ''}` }, entry.index))
            ] }) : jsx('span', { className: 'text-[0.6875rem] text-(--ui-text-tertiary)', children: 'لا توجد سوابق.' })
          ] }) : null
        ]
      }),

      jsxs(Section, { title: 'السلوك', children: [
        jsxs('div', { className: 'grid grid-cols-2 gap-2', children: [
          jsx(Field, { label: 'Reasoning', children: jsx(Select, { value: reasoning, onValueChange: setReasoning, children: jsxs(SelectTrigger, { className: 'h-8', children: [jsx(SelectValue, {}), jsxs(SelectContent, { children: ['none', 'low', 'medium', 'high'].map(item => jsx(SelectItem, { value: item, children: item }, item)) })] }) }) }),
          jsx(Field, { label: 'Fast mode', children: jsx(Select, { value: fast ? 'fast' : 'normal', onValueChange: value => setFast(value === 'fast'), children: jsxs(SelectTrigger, { className: 'h-8', children: [jsx(SelectValue, {}), jsxs(SelectContent, { children: [jsx(SelectItem, { value: 'normal', children: 'normal' }), jsx(SelectItem, { value: 'fast', children: 'fast' })] })] }) }) })
        ] })
      ] }),

      jsxs('div', { className: 'flex items-center gap-2', children: [
        jsx(Button, { className: 'flex-1', disabled: saving, onClick: () => void save(), children: saving ? 'جارٍ الحفظ...' : 'حفظ وتطبيق' }),
        jsx(Button, { size: 'sm', variant: 'ghost', disabled: saving || !provider, onClick: () => void disconnect(), children: jsx(Codicon, { name: 'trash', size: '0.8rem' }) })
      ] }),

      jsx(Separator, {}),
      jsx('div', { className: 'text-[0.6875rem] text-(--ui-text-tertiary)', children: 'المفتاح يُحفظ في مخزن Hermes المشفّر ولا يُعرض إلا عند "كشف". التغييرات تخص الـProfile الحالي.' })
    ]
  })
}

export default {
  id: ID,
  name: 'Model Studio',
  description: 'اختيار المزود والموديل وإدارة مفاتيح API وإعدادات النموذج.',
  register(ctx) {
    const PANE_ID = `${ID}:pane`
    let paneDispose = null
    let chipDispose = null

    function showPane() {
      ctx.storage.set('paneHidden', false)
      if (!paneDispose) {
        paneDispose = ctx.register({
          id: 'pane',
          area: 'panes',
          title: 'Model Studio',
          data: { placement: 'right', width: '340px' },
          render: () => jsx(ModelStudio, { onHide: hidePane })
        })
      }
      if (typeof host.revealPane === 'function') host.revealPane(PANE_ID)
      if (chipDispose) { chipDispose(); chipDispose = null }
    }

    function hidePane() {
      ctx.storage.set('paneHidden', true)
      if (paneDispose) { paneDispose(); paneDispose = null }
      if (!chipDispose) {
        chipDispose = ctx.register({
          id: 'open',
          area: 'statusBar.right',
          order: 120,
          render: () => jsx('button', {
            type: 'button',
            className: 'h-full px-1.5 text-[0.6875rem] text-(--ui-text-tertiary) hover:bg-(--chrome-action-hover) hover:text-foreground',
            onClick: showPane,
            children: 'model studio'
          })
        })
      }
    }

    if (ctx.storage.get('paneHidden', false)) hidePane()
    else showPane()
  }
}
