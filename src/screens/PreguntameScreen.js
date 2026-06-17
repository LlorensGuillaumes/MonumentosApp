import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { adminChat, getMonumentosByIds } from '../services/api';
import LeafletMap from '../components/LeafletMap';
import { COLORS } from '../utils/colors';

const MODES = [
  { id: 'mixto', i18n: 'preguntame.modeMixto', fallback: 'Mixt' },
  { id: 'imprescindibles', i18n: 'preguntame.modeImprescindibles', fallback: 'Imprescindibles' },
  { id: 'descubre', i18n: 'preguntame.modeDescubre', fallback: 'Descobreix' },
];

const buildSystemMessage = (t) => ({
  role: 'system',
  content: t('preguntame.systemHint', 'Pregunta\'m què visitar a una zona, sobre un monument, autor, període, ruta cultural…'),
});

export default function PreguntameScreen({ navigation }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([buildSystemMessage(t)]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState('mixto');
  const [highlights, setHighlights] = useState([]);
  const [tab, setTab] = useState('chat');
  const scrollRef = useRef(null);

  // Scroll-bottom en cada missatge nou
  useEffect(() => {
    if (scrollRef.current && tab === 'chat') {
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
    }
  }, [messages, tab]);

  const fetchHighlights = useCallback(async (answerText) => {
    const ids = [...new Set([...(answerText || '').matchAll(/#(\d{1,7})/g)].map(m => parseInt(m[1], 10)))];
    if (ids.length === 0) return;
    try {
      const data = await getMonumentosByIds(ids.slice(0, 30));
      const monumentos = (data?.monumentos || [])
        .filter(m => m.latitud != null && m.longitud != null)
        .map((m, i) => ({
          id: m.id,
          n: i + 1,
          lat: m.latitud,
          lng: m.longitud,
          title: `${i + 1}. ${m.denominacion}`,
          subtitle: m.municipio,
          color: COLORS.primary,
          // perquè getHNListType al LeafletMap pugui actuar
          heritage_label: m.heritage_label,
          hn_lista: m.hn_lista,
        }));
      setHighlights(monumentos);
    } catch {
      // silent
    }
  }, []);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));
      const data = await adminChat({ question: q, modo, history });
      const ans = data.answer || t('preguntame.noResponse', '(sense resposta)');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: ans,
          sources: data.sources || [],
          meta: data.meta || null,
        },
      ]);
      await fetchHighlights(ans);
      // Auto-switch al mapa si hi ha highlights
      const newIds = [...ans.matchAll(/#\d+/g)];
      if (newIds.length > 0) setTab('map');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error';
      setMessages(prev => [...prev, { role: 'error', content: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([buildSystemMessage(t)]);
    setHighlights([]);
  };

  const mapCenter = useMemo(() => {
    if (!highlights.length) return { lat: 40.0, lng: -3.7 };
    return {
      lat: highlights.reduce((s, h) => s + h.lat, 0) / highlights.length,
      lng: highlights.reduce((s, h) => s + h.lng, 0) / highlights.length,
    };
  }, [highlights]);

  // Render del text amb #id substituïts per badges clicables
  const renderAnswerText = (text) => {
    if (!text) return null;
    const idToN = new Map(highlights.map(h => [h.id, h.n]));
    const parts = text.split(/(#\d{1,7})/g);
    return (
      <Text style={styles.assistantText}>
        {parts.map((p, i) => {
          const m = p.match(/^#(\d{1,7})$/);
          if (m) {
            const id = parseInt(m[1], 10);
            const n = idToN.get(id);
            return (
              <Text
                key={i}
                style={styles.idBadge}
                onPress={() => navigation.navigate('Detail', { id })}
              >
                {n ? `${n} ` : ''}#{id}
              </Text>
            );
          }
          return <Text key={i}>{p}</Text>;
        })}
      </Text>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      {/* Tabs Chat / Mapa */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'chat' && styles.tabActive]}
          onPress={() => setTab('chat')}
        >
          <Ionicons name="chatbubbles" size={16} color={tab === 'chat' ? '#fff' : COLORS.textSecondary} />
          <Text style={[styles.tabText, tab === 'chat' && styles.tabTextActive]}>
            {t('preguntame.tabChat', 'Assistent')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'map' && styles.tabActive]}
          onPress={() => setTab('map')}
        >
          <Ionicons name="map" size={16} color={tab === 'map' ? '#fff' : COLORS.textSecondary} />
          <Text style={[styles.tabText, tab === 'map' && styles.tabTextActive]}>
            {t('preguntame.tabMap', 'Mapa')}
          </Text>
          {highlights.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{highlights.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {tab === 'chat' ? (
        <>
          {/* Modes selector + reset */}
          <View style={styles.modesRow}>
            <View style={styles.modesGroup}>
              {MODES.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modeChip, modo === m.id && styles.modeChipActive]}
                  onPress={() => setModo(m.id)}
                >
                  <Text style={[styles.modeText, modo === m.id && styles.modeTextActive]}>
                    {t(m.i18n, m.fallback)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
              <Ionicons name="refresh" size={14} color={COLORS.textSecondary} />
              <Text style={styles.resetText}>{t('preguntame.reset', 'Reset')}</Text>
            </TouchableOpacity>
          </View>

          {/* Conversa */}
          <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ padding: 12 }}>
            {messages.map((m, i) => {
              if (m.role === 'system') {
                return (
                  <View key={i} style={styles.systemBubble}>
                    <Ionicons name="information-circle" size={14} color="#7c2d12" />
                    <Text style={styles.systemText}>{m.content}</Text>
                  </View>
                );
              }
              if (m.role === 'user') {
                return (
                  <View key={i} style={styles.userBubble}>
                    <Text style={styles.userText}>{m.content}</Text>
                  </View>
                );
              }
              if (m.role === 'error') {
                return (
                  <View key={i} style={styles.errorBubble}>
                    <Text style={styles.errorText}>{m.content}</Text>
                  </View>
                );
              }
              // assistant
              return (
                <View key={i} style={styles.assistantBubble}>
                  {renderAnswerText(m.content)}
                  {m.sources?.length > 0 && (
                    <View style={styles.sourcesBox}>
                      <Text style={styles.sourcesTitle}>
                        {t('preguntame.sources', 'Fonts')} ({m.sources.length})
                      </Text>
                      {m.sources.slice(0, 6).map((s, j) => (
                        <TouchableOpacity
                          key={j}
                          style={styles.sourceRow}
                          onPress={() => navigation.navigate('Detail', { id: s.bien_id })}
                        >
                          <Text style={styles.sourceName} numberOfLines={1}>
                            {s.denominacion}
                          </Text>
                          {s.municipio && (
                            <Text style={styles.sourceMun} numberOfLines={1}>
                              {s.municipio}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {m.meta && (
                    <Text style={styles.metaText}>
                      {m.meta.model} · {m.meta.tokens_in || 0} / {m.meta.tokens_out || 0} tk · {m.meta.elapsed_ms || 0}ms
                    </Text>
                  )}
                </View>
              );
            })}
            {loading && (
              <View style={styles.assistantBubble}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.thinkingText}>{t('preguntame.thinking', 'Pensant…')}</Text>
              </View>
            )}
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={t('preguntame.placeholder', 'Què vols saber?')}
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
              onPress={send}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // MAP tab
        <View style={{ flex: 1 }}>
          {highlights.length > 0 ? (
            <LeafletMap
              markers={highlights}
              center={mapCenter}
              zoom={6}
              height="100%"
              interactive
              onMarkerPress={(id) => navigation.navigate('Detail', { id })}
            />
          ) : (
            <View style={styles.mapEmpty}>
              <Ionicons name="map-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.mapEmptyText}>
                {t('preguntame.mapEmpty', 'Pregunta\'m i veuràs els monuments al mapa')}
              </Text>
              <TouchableOpacity style={styles.mapEmptyBtn} onPress={() => setTab('chat')}>
                <Text style={styles.mapEmptyBtnText}>
                  {t('preguntame.goToChat', 'Tornar al chat')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabsRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    position: 'absolute',
    top: 4, right: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  modesRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    gap: 6,
  },
  modesGroup: { flex: 1, flexDirection: 'row', gap: 4 },
  modeChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modeChipActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  modeText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  modeTextActive: { color: COLORS.primary },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  resetText: { fontSize: 11, color: COLORS.textSecondary },
  messages: { flex: 1 },
  systemBubble: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  systemText: { flex: 1, fontSize: 13, color: '#7c2d12', lineHeight: 18 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 14,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
    marginBottom: 8,
  },
  userText: { color: '#fff', fontSize: 14, lineHeight: 19 },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    maxWidth: '90%',
    marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  assistantText: { fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
  idBadge: {
    color: COLORS.primary,
    fontWeight: '700',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  sourcesBox: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  sourcesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  sourceRow: {
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  sourceName: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  sourceMun: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  metaText: { fontSize: 10, color: COLORS.textSecondary, marginTop: 8, fontStyle: 'italic' },
  errorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 10,
    maxWidth: '90%',
    marginBottom: 8,
  },
  errorText: { color: '#991b1b', fontSize: 13 },
  thinkingText: { color: COLORS.textSecondary, marginTop: 6, fontSize: 12, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  mapEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  mapEmptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  mapEmptyBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 6,
  },
  mapEmptyBtnText: { color: '#fff', fontWeight: '600' },
});
