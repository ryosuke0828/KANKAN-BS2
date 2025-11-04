// メンバーの型定義
export interface Member {
  id: number;
  name: string;
  attribute: string;
}

// 計算結果の型定義
export interface CalculationResult {
  totalAmount: number;
  attributeAmounts: {
    [key: string]: number;
  };
  attributeMembers: {
    [key: string]: string[];
  };
}

// 重みの型定義
export interface Weights {
  B3: number;
  B4: number;
  M1: number;
  M2: number;
  D: number;
  P: number;
  Others: number;
}

// 計算履歴の型定義
export interface CalculationHistory {
  id: number;
  date: string;
  totalAmount: number;
  weights: Weights;
  selectedMembers: number[];
  result: CalculationResult;
}
