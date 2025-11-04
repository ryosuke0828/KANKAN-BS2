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
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import CalculationResultComponent from '../components/CalculationResult';
import HistorySidebar from '../components/HistorySidebar';
import WeightSlider from '../components/WeightSlider';
import { Member, CalculationResult, Weights, CalculationHistory } from '../types';

const Home: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [searchWord, setSearchWord] = useState<string>('');
  
  // 属性ごとの重み（0から10に変更）
  const [weights, setWeights] = useState<Weights>({
    B3: 5,
    B4: 5,
    M1: 5,
    M2: 5,
    D: 5,
    P: 5,
    Others: 5,
  });

  // メンバー一覧（サンプルデータ）
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: '山田太郎', attribute: 'B3' },
    { id: 2, name: '佐藤花子', attribute: 'B4' },
    { id: 3, name: '鈴木一郎', attribute: 'M1' },
    { id: 4, name: '田中二郎', attribute: 'M2' },
    { id: 5, name: '高橋三郎', attribute: 'D' },
    { id: 6, name: '伊藤教授', attribute: 'P' },
    { id: 7, name: 'その他太郎', attribute: 'Others' },
  ]);

  // 選択されたメンバー
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // 計算結果
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  // PayPay URL
  const [paypayUrl, setPaypayUrl] = useState<string>('');

  // 計算履歴
  const [history, setHistory] = useState<CalculationHistory[]>([]);

  // ページ読み込み時に履歴を取得
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    // TODO: 実際のAPIコールに置き換える
    console.log('履歴を取得中...');
    
    // 仮のデータ（実際にはAPIから取得）
    const mockHistory: CalculationHistory[] = [
      {
        id: 1,
        date: '2025-11-04T10:30:00',
        totalAmount: 10000,
        weights: { B3: 3, B4: 4, M1: 5, M2: 6, D: 7, P: 8, Others: 5 },
        selectedMembers: [1, 2, 3],
        result: {
          totalAmount: 10000,
          attributeAmounts: { B3: 3000, B4: 4000, M1: 3000 },
          attributeMembers: { B3: ['山田太郎'], B4: ['佐藤花子'], M1: ['鈴木一郎'] },
        },
      },
      {
        id: 2,
        date: '2025-11-03T15:20:00',
        totalAmount: 8000,
        weights: { B3: 5, B4: 5, M1: 5, M2: 5, D: 5, P: 5, Others: 5 },
        selectedMembers: [4, 5],
        result: {
          totalAmount: 8000,
          attributeAmounts: { M2: 4000, D: 4000 },
          attributeMembers: { M2: ['田中二郎'], D: ['高橋三郎'] },
        },
      },
    ];
    
    setHistory(mockHistory);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleWeightChange = (attribute: keyof Weights, value: number) => {
    setWeights({
      ...weights,
      [attribute]: value,
    });
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSearch = async () => {
    // TODO: APIコールを実装
    console.log('検索ワード:', searchWord);
    // 仮の実装: 検索ワードに一致するメンバーを自動選択
    const matchedMembers = members
      .filter((member) => member.name.includes(searchWord) || member.attribute.includes(searchWord))
      .map((member) => member.id);
    setSelectedMembers((prev) => {
      const uniqueIds = new Set([...prev, ...matchedMembers]);
      return Array.from(uniqueIds);
    });
  };

  const handleCalculate = () => {
    // TODO: 実際のAPIコールに置き換える
    console.log('計算開始');
    console.log('合計金額:', totalAmount);
    console.log('重み:', weights);
    console.log('選択されたメンバー:', selectedMembers);

    // 仮の計算ロジック
    const selectedMembersList = members.filter((m) => selectedMembers.includes(m.id));
    
    // 属性ごとのメンバーをグループ化
    const attributeMembers: { [key: string]: string[] } = {};
    selectedMembersList.forEach((member) => {
      if (!attributeMembers[member.attribute]) {
        attributeMembers[member.attribute] = [];
      }
      attributeMembers[member.attribute].push(member.name);
    });

    // 属性ごとの支払い金額を計算（重み付き）
    const attributeAmounts: { [key: string]: number } = {};
    let totalWeight = 0;
    
    Object.keys(attributeMembers).forEach((attr) => {
      const memberCount = attributeMembers[attr].length;
      const weight = weights[attr as keyof typeof weights];
      totalWeight += memberCount * weight;
    });

    Object.keys(attributeMembers).forEach((attr) => {
      const memberCount = attributeMembers[attr].length;
      const weight = weights[attr as keyof typeof weights];
      attributeAmounts[attr] = Math.round((Number(totalAmount) * memberCount * weight) / totalWeight);
    });

    setCalculationResult({
      totalAmount: Number(totalAmount),
      attributeAmounts,
      attributeMembers,
    });

    handleClose();
  };

  const handleRecalculate = () => {
    // 現在の値を保持したままポップアップを再表示
    setOpen(true);
  };

  const handleHistoryClick = (historyItem: CalculationHistory) => {
    // 履歴項目をクリックした時の処理
    setTotalAmount(historyItem.totalAmount.toString());
    setWeights(historyItem.weights);
    setSelectedMembers(historyItem.selectedMembers);
    setCalculationResult(historyItem.result);
  };

  const handlePayPaySubmit = async () => {
    // TODO: PayPay URL送信のAPIコールを実装
    console.log('PayPay URL送信:', paypayUrl);
    console.log('計算結果:', calculationResult);
    
    // 仮の実装
    alert('PayPay URLを送信しました');
    setPaypayUrl('');
  };

  const marks = [
    { value: 0, label: '0' },
    { value: 5, label: '5' },
    { value: 10, label: '10' },
  ];

  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      {/* メインコンテンツエリア */}
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          割り勘計算システム
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CalculateIcon />}
            onClick={handleClickOpen}
          >
            計算を開始する
          </Button>
        </Box>

      {/* 計算結果表示セクション */}
      {calculationResult && (
        <CalculationResultComponent result={calculationResult} onRecalculate={handleRecalculate} />
      )}

      {/* PayPay URL送信セクション（常に表示） */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Paper elevation={2} sx={{ p: 3, maxWidth: 600, width: '100%' }}>
          <Typography variant="h6" gutterBottom align="center">
            PayPay URL送信
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="PayPay URL"
              value={paypayUrl}
              onChange={(e) => setPaypayUrl(e.target.value)}
              placeholder="https://..."
            />
            <Button
              variant="contained"
              onClick={handlePayPaySubmit}
              disabled={!paypayUrl || !calculationResult}
              sx={{ minWidth: 100 }}
            >
              送信
            </Button>
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>割り勘計算</DialogTitle>
        <DialogContent dividers>
          {/* 金額入力セクション */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              割り勘対象の金額
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="金額"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              InputProps={{
                endAdornment: <Typography>円</Typography>,
              }}
              sx={{ mt: 1 }}
            />
          </Box>

          {/* 属性ごとの重み設定セクション */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              属性ごとの重み設定
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* 左側4個 */}
              <Grid item xs={12} md={6}>
                {['B3', 'B4', 'M1', 'M2'].map((attr) => (
                  <WeightSlider
                    key={attr}
                    attribute={attr}
                    value={weights[attr as keyof Weights]}
                    onChange={(value) => handleWeightChange(attr as keyof Weights, value)}
                    marks={marks}
                  />
                ))}
              </Grid>
              
              {/* 右側3個 */}
              <Grid item xs={12} md={6}>
                {['D', 'P', 'Others'].map((attr) => (
                  <WeightSlider
                    key={attr}
                    attribute={attr}
                    value={weights[attr as keyof Weights]}
                    onChange={(value) => handleWeightChange(attr as keyof Weights, value)}
                    marks={marks}
                  />
                ))}
              </Grid>
            </Grid>
          </Box>

          {/* メンバー検索セクション */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              参加メンバーを検索
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="検索ワード"
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                placeholder="名前または属性で検索"
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ minWidth: 100 }}
              >
                検索
              </Button>
            </Box>
          </Box>

          {/* メンバー選択セクション */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              参加メンバーを選択
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">選択</TableCell>
                    <TableCell>名前</TableCell>
                    <TableCell>属性</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => (
                    <TableRow
                      key={member.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedMembers.includes(member.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleMemberToggle(member.id);
                          }}
                        />
                      </TableCell>
                      <TableCell onClick={() => handleMemberToggle(member.id)}>
                        {member.name}
                      </TableCell>
                      <TableCell onClick={() => handleMemberToggle(member.id)}>
                        {member.attribute}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              選択中: {selectedMembers.length}人
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button
            onClick={handleCalculate}
            variant="contained"
            disabled={!totalAmount || selectedMembers.length === 0}
          >
            計算実行
          </Button>
        </DialogActions>
      </Dialog>
      </Box>

      {/* 右側：計算履歴エリア */}
      <HistorySidebar history={history} onHistoryClick={handleHistoryClick} />
    </Box>
  );
};

export default Home;
