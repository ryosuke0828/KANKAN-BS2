# Backend - 4層レイヤードアーキテクチャ

## ディレクトリ構成

```
backend/
├── presentation/       # プレゼンテーション層
│   └── handlers/      # HTTPリクエスト/レスポンスハンドラー
├── application/       # アプリケーション層
│   └── usecases/      # ビジネスロジック、ユースケース
├── domain/            # ドメイン層
│   ├── entities/      # エンティティ、ドメインモデル
│   └── interfaces/    # リポジトリインターフェース定義
└── infrastructure/    # インフラストラクチャ層
    ├── repositories/  # データベースアクセス実装
    └── external/      # 外部APIクライアント
```

## 各層の責務

### 1. Presentation層 (`presentation/`)
- HTTPリクエストの受け取りとレスポンスの返却
- リクエストのバリデーション
- Application層への委譲
- エラーハンドリング

### 2. Application層 (`application/`)
- ビジネスロジックの実装
- ユースケースの調整
- トランザクション管理
- Domain層とInfrastructure層の連携

### 3. Domain層 (`domain/`)
- ビジネスルールの定義
- エンティティ（ドメインモデル）
- リポジトリインターフェース
- ドメインロジック

### 4. Infrastructure層 (`infrastructure/`)
- データベースアクセスの実装
- 外部APIとの通信
- ファイルシステムアクセス
- その他外部リソースへのアクセス

## 依存関係の方向

```
Presentation → Application → Domain ← Infrastructure
```

- 上位層は下位層に依存可能
- 下位層は上位層に依存してはいけない
- Infrastructure層はDomainのインターフェースを実装
