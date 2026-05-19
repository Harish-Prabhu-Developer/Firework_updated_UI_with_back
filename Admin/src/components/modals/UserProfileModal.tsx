import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { User, Mail, Phone, Shield, Edit2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FormModal } from './FormModal';
import { LightColors as colors } from '../../styles/colors';
import { Fonts, Radius } from '../../styles/globalStyles';
import api, { parseApiError } from '../../api/api';
import { useToast } from '../../hooks/useToast';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const UserProfileModal = ({ open, onClose }: UserProfileModalProps) => {
  const [user, setUser] = useState<{id?: string; name?: string; email?: string; phone?: string; roleName?: string} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      AsyncStorage.getItem('user').then(raw => {
        if (raw) {
          try {
            const parsedUser = JSON.parse(raw);
            setUser(parsedUser);
            setIsEditing(false);
            setEditForm({
              name: parsedUser?.name || '',
              email: parsedUser?.email || '',
              phone: parsedUser?.phone || '',
            });
          } catch {}
        }
      });
    }
  }, [open]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const res = await api.put(`/users/${user.id}`, editForm);
      if (res.data.success) {
        const updatedUser = { ...user, ...editForm };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (e) {
      toast.apiError(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormModal 
      open={open} 
      onClose={onClose}
      title={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground, fontFamily: Fonts.display }}>User Profile</Text>
          {!isEditing && (
            <Pressable onPress={() => setIsEditing(true)}>
              <Edit2 size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>
      }
      maxWidth={400}
      footer={
        isEditing ? (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
            <Pressable style={styles.cancelBtn} onPress={() => setIsEditing(false)} disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </Pressable>
          </View>
        ) : undefined
      }
    >
      <View style={{ gap: 16 }}>
        <View style={styles.profileRow}>
          <User size={20} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileLabel}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter name"
              />
            ) : (
              <Text style={styles.profileValue}>{user?.name || '-'}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.profileRow}>
          <Shield size={20} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileLabel}>Role (View Only)</Text>
            <Text style={styles.profileValue}>{user?.roleName || '-'}</Text>
          </View>
        </View>

        <View style={styles.profileRow}>
          <Mail size={20} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileLabel}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.profileValue}>{user?.email || '-'}</Text>
            )}
          </View>
        </View>

        <View style={styles.profileRow}>
          <Phone size={20} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileLabel}>Phone</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.profileValue}>{user?.phone || '-'}</Text>
            )}
          </View>
        </View>
      </View>
    </FormModal>
  );
};

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontFamily: Fonts.body,
  },
  profileValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: Fonts.body,
    marginTop: 2,
  },
  input: {
    height: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    marginTop: 4,
    fontSize: 14,
    color: colors.foreground,
    fontFamily: Fonts.body,
    backgroundColor: '#FAFAFA',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: Fonts.body,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: Fonts.body,
  },
});
