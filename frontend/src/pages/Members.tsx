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
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import api from '../api/axios'; // 追加

type Attribute = 'B3' | 'B4' | 'M1' | 'M2' | 'D' | 'P' | 'Others';

// バックエンドのLabMemberエンティティに合わせる
interface Member {
  id: string;
  name: string;
  attribute: Attribute;
  slackDmId: string;
  userId: string;
}

type SortField = 'name' | 'attribute' | 'slackDmId';
type SortOrder = 'asc' | 'desc';

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true); // 追加
  const [error, setError] = useState<string | null>(null); // 追加
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    attribute: '' as Attribute | '',
    slackDmId: '',
  });
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // データ取得
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Member[]>('/lab-members');
      setMembers(response.data);
    } catch (error) {
      console.error('メンバーの取得に失敗しました:', error);
      setError('メンバーの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // ダイアログを開く（新規追加）
  const handleOpenAddDialog = () => {
    setEditingMember(null);
    setFormData({ name: '', attribute: '', slackDmId: '' });
    setOpenDialog(true);
  };

  // ダイアログを開く（編集）
  const handleOpenEditDialog = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      attribute: member.attribute,
      slackDmId: member.slackDmId,
    });
    setOpenDialog(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMember(null);
    setFormData({ name: '', attribute: '', slackDmId: '' });
  };

  // フォーム入力の変更
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 保存処理 (TODO: API連携)
  const handleSave = async () => {
    if (!formData.name || !formData.attribute || !formData.slackDmId) {
      alert('全ての項目を入力してください');
      return;
    }
    console.log('Save:', editingMember ? { ...editingMember, ...formData } : formData);
    handleCloseDialog();
    // fetchMembers(); // API連携後に有効化
  };

  // 削除処理 (TODO: API連携)
  const handleDelete = async (id: string) => {
    if (!window.confirm('このメンバーを削除してもよろしいですか？')) return;
    console.log('Delete:', id);
    // fetchMembers(); // API連携後に有効化
  };

  // ソート処理
  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedMembers = [...members].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const attributeOptions: Attribute[] = ['B3', 'B4', 'M1', 'M2', 'D', 'P', 'Others'];

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
                  active={sortField === 'attribute'}
                  direction={sortField === 'attribute' ? sortOrder : 'asc'}
                  onClick={() => handleSort('attribute')}
                >
                  属性
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'slackDmId'}
                  direction={sortField === 'slackDmId' ? sortOrder : 'asc'}
                  onClick={() => handleSort('slackDmId')}
                >
                  Slack DM ID
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Alert severity="error">{error}</Alert>
                </TableCell>
              </TableRow>
            ) : sortedMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  メンバーが見つかりません。
                </TableCell>
              </TableRow>
            ) : (
              sortedMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.attribute}</TableCell>
                  <TableCell>{member.slackDmId}</TableCell>
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
              ))
            )}
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
              <InputLabel>属性</InputLabel>
              <Select
                value={formData.attribute}
                label="属性"
                onChange={(e) => handleInputChange('attribute', e.target.value)}
              >
                {attributeOptions.map((attr) => (
                  <MenuItem key={attr} value={attr}>
                    {attr}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Slack DM ID"
              required
              fullWidth
              value={formData.slackDmId}
              onChange={(e) => handleInputChange('slackDmId', e.target.value)}
              placeholder="U..."
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
