export const MemberAttributes = {
  B3: 'B3',
  B4: 'B4',
  M1: 'M1',
  M2: 'M2',
  D: 'D',
  P: 'P', // 博士研究員 (Postdoctoral researcher)
  Others: 'Others',
} as const;

export type MemberAttribute = typeof MemberAttributes[keyof typeof MemberAttributes];
