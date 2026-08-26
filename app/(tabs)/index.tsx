import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  tag: 'design' | 'dev' | 'marketing';
}

export default function MyApp() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Thiết kế giao diện dashboard Mockup (Figma)', completed: true, tag: 'design' },
    { id: 2, text: 'Tích hợp cơ sở dữ liệu & API backend', completed: false, tag: 'dev' },
    { id: 3, text: 'Viết tài liệu hướng dẫn sử dụng chi tiết', completed: false, tag: 'dev' },
    { id: 4, text: 'Chạy chiến dịch Marketing ra mắt sản phẩm', completed: false, tag: 'marketing' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTag, setNewTaskTag] = useState<'design' | 'dev' | 'marketing'>('dev');

  const handleToggleTask = (id: number) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false,
      tag: newTaskTag,
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
  };

  const filteredTasks = tasks.filter(task =>
    task.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          {/* Header Section */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>Chào mừng quay trở lại!</Text>
              <Text style={styles.headerTitle}>Antigravity Dev</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AD</Text>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm nhiệm vụ..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Stats Cards Row */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.glassPanel]}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Nhiệm vụ</Text>
                <Feather name="check-square" size={16} color="#6366f1" />
              </View>
              <Text style={styles.statValue}>{tasks.length}</Text>
              <Text style={styles.statTrendUp}>+12% tuần này</Text>
            </View>

            <View style={[styles.statCard, styles.glassPanel]}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Hoàn thành</Text>
                <Feather name="zap" size={16} color="#a855f7" />
              </View>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statTrendUp}>{completionRate}% tiến độ</Text>
            </View>
          </View>

          {/* Productivity progress */}
          <View style={[styles.progressCard, styles.glassPanel]}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Năng suất dự án</Text>
              <Text style={styles.progressPercent}>{completionRate}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
            </View>
          </View>

          {/* Tasks List */}
          <View style={[styles.tasksCard, styles.glassPanel]}>
            <Text style={styles.sectionTitle}>Nhiệm vụ tuần</Text>
            
            <View style={styles.tasksList}>
              {filteredTasks.length === 0 ? (
                <Text style={styles.emptyText}>Không tìm thấy nhiệm vụ nào.</Text>
              ) : (
                filteredTasks.map(task => (
                  <View key={task.id} style={styles.taskItem}>
                    <TouchableOpacity
                      style={styles.taskCheckboxContainer}
                      onPress={() => handleToggleTask(task.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
                        {task.completed && <Feather name="check" size={12} color="#fff" />}
                      </View>
                      <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
                        {task.text}
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.taskActions}>
                      <View style={[styles.tag, styles[`tag_${task.tag}` as any]]}>
                        <Text style={styles.tagText}>{task.tag}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteTask(task.id)} activeOpacity={0.7}>
                        <Feather name="trash-2" size={16} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Quick Add Task */}
            <View style={styles.addTaskForm}>
              <TextInput
                style={styles.addTaskInput}
                placeholder="Thêm nhiệm vụ mới..."
                placeholderTextColor="#64748b"
                value={newTaskText}
                onChangeText={setNewTaskText}
              />
              
              <View style={styles.tagSelector}>
                {(['dev', 'design', 'marketing'] as const).map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagButton,
                      newTaskTag === tag && styles.tagButtonActive
                    ]}
                    onPress={() => setNewTaskTag(tag)}
                  >
                    <Text style={[
                      styles.tagButtonText,
                      newTaskTag === tag && styles.tagButtonTextActive
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.addButton} onPress={handleAddTask} activeOpacity={0.8}>
                <Feather name="plus" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  glassPanel: {
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statTrendUp: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  progressCard: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  tasksCard: {
    padding: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  tasksList: {
    marginBottom: 20,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#64748b',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  taskText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  tag_dev: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  tag_design: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  tag_marketing: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#cbd5e1',
    textTransform: 'uppercase',
  },
  addTaskForm: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 16,
  },
  addTaskInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    color: '#f8fafc',
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    marginBottom: 12,
  },
  tagSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tagButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  tagButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tagButtonTextActive: {
    color: '#6366f1',
  },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    height: 42,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
