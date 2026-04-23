import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import supabase from '../../services/supabase';
import { useAppStore } from '../../store';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';
import type { Comment } from '../../types';

export default function PostDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { post } = route.params;
  const { user } = useAppStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    const { data } = await supabase.from('comments').select('*, user:users(full_name,avatar_url)').eq('post_id', post.id).order('created_at');
    if (data) setComments(data as any);
  };

  useEffect(() => { loadComments(); }, []);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, content: text.trim() });
    setText('');
    await loadComments();
    setSending(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Comments</Text>
        <View style={{ width: 50 }} />
      </View>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.post}>
            {post.image_url && <Image source={{ uri: post.image_url }} style={styles.postImage} />}
            <Text style={styles.postContent}>{post.content}</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <View style={styles.comment}>
            <View style={[styles.avatar, { backgroundColor: Colors.primary }]}><Text style={styles.avatarText}>{item.user?.full_name?.[0] || '?'}</Text></View>
            <View style={styles.commentBody}>
              <Text style={styles.commentUser}>{item.user?.full_name}</Text>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Add a comment..." placeholderTextColor={Colors.textMuted} />
        <TouchableOpacity style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!text.trim() || sending}>
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingTop: Spacing.huge },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium, width: 50 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 80 },
  post: { gap: Spacing.sm, marginBottom: Spacing.xl, paddingBottom: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  postImage: { width: '100%', height: 200, borderRadius: BorderRadius.lg },
  postContent: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  comment: { flexDirection: 'row', gap: Spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: FontWeight.bold },
  commentBody: { flex: 1, backgroundColor: Colors.surfaceAlt, padding: Spacing.md, borderRadius: BorderRadius.lg, gap: 2 },
  commentUser: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  commentText: { fontSize: FontSize.sm, color: Colors.text },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnText: { color: '#fff', fontWeight: FontWeight.black, fontSize: FontSize.lg },
});
