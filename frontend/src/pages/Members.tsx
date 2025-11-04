import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TableSortLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

type Grade = 'B3' | 'B4' | 'M1' | 'M2' | 'D' | 'P' | 'Others';

interface Member {
  id: string;
  name: string;
  grade: Grade;
  slackId: string;
}

type SortField = 'name' | 'grade' | 'slackId';
type SortOrder = 'asc' | 'desc';

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '' as Grade | '',
    slackId: '',
  });
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // データ取得
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      // TODO: 実際のAPIエンドポイントに置き換える
      // const response = await fetch('/api/members');
      // const data = await response.json();
      // setMembers(data);
      
      // ダミーデータ（開発用）
      const dummyData: Member[] = [
        { id: '1', name: '山田太郎', grade: 'B4', slackId: '@yamada' },
        { id: '2', name: '佐藤花子', grade: 'M1', slackId: '@sato' },
        { id: '3', name: '鈴木一郎', grade: 'B3', slackId: '@suzuki' },
      ];
      setMembers(dummyData);
    } catch (error) {
      console.error('メンバーの取得に失敗しました:', error);
    }
  };

  // ダイアログを開く（新規追加）
  const handleOpenAddDialog = () => {
    setEditingMember(null);
    setFormData({ name: '', grade: '', slackId: '' });
    setOpenDialog(true);
  };

  // ダイアログを開く（編集）
  const handleOpenEditDialog = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      grade: member.grade,
      slackId: member.slackId,
    });
    setOpenDialog(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMember(null);
    setFormData({ name: '', grade: '', slackId: '' });
  };

  // フォーム入力の変更
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 保存処理
  const handleSave = async () => {
    // バリデーション
    if (!formData.name || !formData.grade || !formData.slackId) {
      alert('全ての項目を入力してください');
      return;
    }

    try {
      if (editingMember) {
        // 編集
        // TODO: 実際のAPIエンドポイントに置き換える
        // await fetch(`/api/members/${editingMember.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData),
        // });
        console.log('メンバーを更新:', { ...editingMember, ...formData });
      } else {
        // 新規追加
        // TODO: 実際のAPIエンドポイントに置き換える
        // await fetch('/api/members', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData),
        // });
        console.log('メンバーを追加:', formData);
      }
      
      handleCloseDialog();
      fetchMembers();
    } catch (error) {
      console.error('保存に失敗しました:', error);
      alert('保存に失敗しました');
    }
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    if (!window.confirm('このメンバーを削除してもよろしいですか？')) {
      return;
    }

    try {
      // TODO: 実際のAPIエンドポイントに置き換える
      // await fetch(`/api/members/${id}`, { method: 'DELETE' });
      console.log('メンバーを削除:', id);
      
      fetchMembers();
    } catch (error) {
      console.error('削除に失敗しました:', error);
      alert('削除に失敗しました');
    }
  };

  // ソート処理
  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // ソート済みメンバーリスト
  const sortedMembers = [...members].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const gradeOptions: Grade[] = ['B3', 'B4', 'M1', 'M2', 'D', 'P', 'Others'];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">メンバー管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          メンバー追加
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  氏名
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'grade'}
                  direction={sortField === 'grade' ? sortOrder : 'asc'}
                  onClick={() => handleSort('grade')}
                >
                  学年
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'slackId'}
                  direction={sortField === 'slackId' ? sortOrder : 'asc'}
                  onClick={() => handleSort('slackId')}
                >
                  Slack ID
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.grade}</TableCell>
                <TableCell>{member.slackId}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenEditDialog(member)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(member.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* メンバー追加・編集ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMember ? 'メンバー編集' : 'メンバー追加'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="氏名"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            <FormControl fullWidth required>
              <InputLabel>学年</InputLabel>
              <Select
                value={formData.grade}
                label="学年"
                onChange={(e) => handleInputChange('grade', e.target.value)}
              >
                {gradeOptions.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    {grade}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Slack ID"
              required
              fullWidth
              value={formData.slackId}
              onChange={(e) => handleInputChange('slackId', e.target.value)}
              placeholder="@username"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Members;
