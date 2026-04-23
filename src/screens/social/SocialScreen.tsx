import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, Modal, Alert, RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import supabase from '../../services/supabase';
import { useAppStore } from '../../store';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PremiumBadge from '../../components/common/PremiumBadge';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import type { SocialPost } from '../../types';

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, activeDog, subscriptionTier } = useAppStore();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('social_posts')
      .select(`*, user:users(id,full_name,avatar_url,subscription_tier), dog:dogs(name,avatar_url,level,tier)`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data && user) {
      const likedIds = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      const likedSet = new Set((likedIds.data || []).map((l: any) => l.post_id));
      setPosts(data.map((p) => ({ ...p, liked_by_me: likedSet.has(p.id) })) as any);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleLike = async (post: SocialPost) => {
    if (!user) return;
    if (post.liked_by_me) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.likes_count + (p.liked_by_me ? -1 : 1) }
          : p
      )
    );
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.85,
    });
    if (!res.canceled) setPostImage(res.assets[0].uri);
  };

  const handlePost = async () => {
    if (!postContent.trim() && !postImage) return;
    if (!user || !activeDog) return;
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (postImage) {
        const ext = postImage.split('.').pop();
        const path = `social/${user.id}/${Date.now()}.${ext}`;
        const res = await fetch(postImage);
        const blob = await res.blob();
        await supabase.storage.from('social-photos').upload(path, blob);
        const { data } = supabase.storage.from('social-photos').getPublicUrl(path);
        imageUrl = data.publicUrl;
      }

      await supabase.from('social_posts').insert({
        user_id: user.id,
        dog_id: activeDog.id,
        content: postContent.trim(),
        image_url: imageUrl,
        post_type: 'regular',
      });

      setShowCreate(false);
      setPostContent('');
      setPostImage(null);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setPosting(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderPost = ({ item }: { item: SocialPost }) => {
    const u = item.user as any;
    const d = item.dog as any;
    return (
      <Card style={styles.postCard} padding={0}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          {u?.avatar_url ? (
            <Image source={{ uri: u.avatar_url }} style={styles.postAvatar} />
          ) : (
            <View style={[styles.postAvatar, styles.postAvatarPlaceholder]}>
              <Text style={styles.postAvatarText}>{u?.full_name?.[0] || '?'}</Text>
            </View>
          )}
          <View style={styles.postUserInfo}>
            <View style={styles.postUserRow}>
              <Text style={styles.postUserName}>{u?.full_name}</Text>
              <PremiumBadge tier={u?.subscription_tier || 'free'} size="sm" />
            </View>
            {d && (
              <Text style={styles.postDogLine}>
                🐾 {d.name} · Lv.{d.level} {d.tier}
              </Text>
            )}
            <Text style={styles.postTime}>{formatTime(item.created_at)}</Text>
          </View>
        </View>

        {/* Content */}
        {item.content ? <Text style={styles.postContent}>{item.content}</Text> : null}

        {/* Image */}
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.postImage} resizeMode="cover" />
        )}

        {/* Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item)}>
            <Text style={[styles.actionIcon, item.liked_by_me && styles.actionIconLiked]}>
              {item.liked_by_me ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.actionCount}>{item.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PostDetail', { post: item })}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{item.comments_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>📤</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.pageTitle}>🐾 Social</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={styles.emptyText}>No posts yet.{'\n'}Be the first to share!</Text>
          </View>
        }
      />

      {/* Create Post Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity onPress={handlePost} disabled={posting}>
              <Text style={[styles.modalPost, posting && styles.modalPostDisabled]}>Post</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.postInput}
            value={postContent}
            onChangeText={setPostContent}
            placeholder="What's your dog up to? 🐾"
            placeholderTextColor={Colors.textMuted}
            multiline
            autoFocus
          />

          {postImage && (
            <Image source={{ uri: postImage }} style={styles.previewImage} />
          )}

          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
            <Text style={styles.addPhotoBtnText}>📸 {postImage ? 'Change Photo' : 'Add Photo'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text },
  createBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: BorderRadius.full },
  createBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  list: { padding: Spacing.lg, gap: Spacing.md },
  postCard: { overflow: 'hidden' },
  postHeader: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, alignItems: 'center' },
  postAvatar: { width: 42, height: 42, borderRadius: 21 },
  postAvatarPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { color: '#fff', fontWeight: FontWeight.bold },
  postUserInfo: { flex: 1, gap: 2 },
  postUserRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postUserName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  postDogLine: { fontSize: FontSize.xs, color: Colors.textSecondary },
  postTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  postContent: { fontSize: FontSize.md, color: Colors.text, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, lineHeight: 22 },
  postImage: { width: '100%', height: 240 },
  postActions: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 20 },
  actionIconLiked: {},
  actionCount: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 60 },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, textAlign: 'center', lineHeight: 28 },
  modalContainer: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalCancel: { fontSize: FontSize.md, color: Colors.textSecondary },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  modalPost: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.bold },
  modalPostDisabled: { opacity: 0.5 },
  postInput: { padding: Spacing.xl, fontSize: FontSize.lg, color: Colors.text, minHeight: 120, textAlignVertical: 'top' },
  previewImage: { width: '100%', height: 200 },
  addPhotoBtn: { padding: Spacing.lg },
  addPhotoBtnText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
});
