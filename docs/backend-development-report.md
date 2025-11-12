# バックエンド開発レポート (2025年11月12日)

## 概要
本日は、前回からの課題であったAPIエンドポイントのデバッグを完了させ、続いてユーザーごとのSlack APIトークンをAWS KMSを利用して暗号化する実装を行いました。また、その検証のためのテスト環境をJestで構築しました。

## 作業内容

### 1. APIエンドポイントのデバッグ
- **`Runtime.ImportModuleError`の解決:**
  - APIエンドポイントへの初回テスト時に`Internal Server Error`が発生。CloudWatch Logsから、Lambdaの起動自体が失敗する`Runtime.ImportModuleError`が原因であることを特定しました。
  - これはTypeScriptのパスエイリアスがビルド後のJavaScriptで正しく解決されていないことが原因でした。`npm run build` (`tsc && tsc-alias`) を実行してコードを再ビルドし、デプロイパッケージを再作成してTerraformでデプロイすることで解決しました。
- **ルーティングエラーの解決:**
  - 次に`Cannot GET /api/members`というExpressからの404エラーに遭遇。これはLambdaとExpressサーバーは起動しているものの、ルートが見つからないことを示していました。
  - 調査の結果、`presentation`ディレクトリ内のソースコードが更新されており、エンドポイントが`GET /api/members`から`POST /api/v1/members/collect-from-slack`に変更されていたことが判明しました。
  - 正しいエンドポイントにリクエストを送信したところ、アプリケーションロジックが実行され、DBにユーザーが存在しないことを示す`User not found`エラーが返ることを確認。これにより、APIエンドポイントの基本的な動作が正常であることを確認しました。

### 2. ユーザー別トークンの暗号化実装
- **課題と方針転換:**
  - 当初、「Slack APIトークンをセキュアに管理する」という課題に対し、一般的なアプリケーション単位のトークンを想定してAWS Secrets Managerを利用する実装を提案・開始しました。
  - しかし、ユーザーからの指摘で「トークンはユーザーごとに個別で管理する」という要件を再確認。私の最初の前提が誤っていたため、実装したコードとインフラの変更をすべて元に戻しました。
- **KMSによるアプリケーションレベル暗号化の実装:**
  - **目的:** `Users`テーブルに平文で保存されているユーザー毎の`slackApiToken`のセキュリティを向上させる。
  - **方針:** アプリケーションレイヤーでAWS KMS (Key Management Service)を利用し、データベースに保存されるトークンを暗号化する。リポジトリ層(`UserRepositoryImpl`)で暗号化・復号を透過的に行い、ドメイン層やアプリケーション層は暗号化を意識しない設計としました。
  - **実装:**
    - **Terraform:** 暗号化・復号に使うための`aws_kms_key`リソースを作成し、LambdaのIAMロールにそのキーへのアクセス権限 (`kms:Encrypt`, `kms:Decrypt`) を付与。キーIDを`KMS_KEY_ID`としてLambdaの環境変数に渡しました。
    - **Backend:**
      - `@aws-sdk/client-kms`パッケージをインストール。
      - `UserRepositoryImpl`に、`save`時に`slackApiToken`をKMSで暗号化する処理と、`find`時に復号する処理を実装しました。

### 3. テスト環境の構築と課題
- **Jestの導入:**
  - `UserRepositoryImpl`の暗号化・復号ロジックを検証するため、テストフレームワークとしてJestを導入しました。
  - `jest`, `ts-jest`, `@types/jest`をインストールし、パスエイリアスを解決できるよう`jest.config.js`を設定しました。
- **テストコードの実装:**
  - テストデータ生成のため、`tests/factories/user.factory.ts`を作成。
  - `UserRepositoryImpl`がDBとKMSと正しく連携して暗号化・復号できるかを確認するインテグレーションテスト`tests/repositories/UserRepositoryImpl.test.ts`を作成しました。
- **残課題:**
  - テスト実行時に、`uuid`パッケージがESM形式であることに起因する`SyntaxError: Unexpected token 'export'`エラーが発生。
  - `jest.config.js`の`transformIgnorePatterns`や`moduleNameMapper`での解決を試みましたが、本日の作業時間内では解決に至りませんでした。これは次回に持ち越す課題となります。

---

# バックエンド開発レポート (2025年11月6日)

## 概要
本日は、ドメイン駆動設計に基づいたTypeScript/Expressバックエンドの主要なコード実装と、TerraformによるAWSインフラの初期構築を進めました。

## 作業内容

### 1. バックエンドアプリケーションのコード実装
- **ドメイン層の骨格作成:**
  - `User` および `LabMember` エンティティを定義しました。
  - `MemberAttribute` 型を定義しました。
  - `IUserRepository`, `ILabMemberRepository`, `ISlackRepository` インターフェースを定義し、ドメイン層の責務を明確にしました。
- **アプリケーション層（ユースケース）の作成:**
  - `GetMembersFromSlackReaction` (Slackリアクションからメンバー取得) ユースケースを実装しました。
  - `PaymentCalculator` (支払い計算) ドメインサービスを実装しました。
  - `CalculatePayment` (支払い計算実行) ユースケースを実装しました。
  - `SendPaymentRequestDm` (Slack DM送信) ユースケースを実装しました。
- **インフラストラクチャ層の実装:**
  - `SlackRepositoryImpl` を実装し、`@slack/web-api` を用いたSlack API連携の基盤を構築しました。
  - `UserRepositoryImpl` および `LabMemberRepositoryImpl` を実装し、DynamoDBとの連携（AWS SDK for JavaScript v3を使用）を構築しました。

### 2. バックエンドプロジェクトのセットアップ
- `backend` ディレクトリで `package.json` を初期化し、TypeScript、Express、AWS SDK、Slack SDK、`serverless-http` などの必要なライブラリをインストールしました。
- `tsconfig.json` をプロジェクトの構成に合わせて設定しました。
- `presentation/server.ts` を作成し、Expressサーバーの基本的な起動ロジックを実装しました。
- `package.json` に `build` および `dev` スクリプトを追加しました。

### 3. Lambda対応とデバッグ
- ExpressアプリケーションをAWS Lambdaで動作させるため、`serverless-http`を導入し、`presentation/server.ts`を修正しました。
- `npm run build`でTypeScriptコードをJavaScriptにビルドし、`zip`コマンドでデプロイパッケージ（`deployment_package.zip`）を作成しました。
- `Runtime.ImportModuleError`が発生したため、パスエイリアス解決のために`tsc-alias`を導入し、`build`スクリプトを修正しました。
- デバッグのため、APIエンドポイントのエラーレスポンスにエラーメッセージとスタックトレースを含めるように一時的に修正しました。

### 4. TerraformによるAWSインフラ構築
- `terraform` ディレクトリを作成し、`main.tf`にAWSプロバイダーの基本設定を記述しました。
- Terraformが未インストールだったため、Homebrew経由でTerraformをインストールしました。
- AWS認証情報が不足していたため、IAMユーザーの作成と`aws configure`による認証情報設定をガイドしました。
- `main.tf`に以下のリソースの設計図を追記し、`terraform apply`でAWS上に構築しました。
  - **DynamoDBテーブル:** `KANKAN-BS2-Users` と `KANKAN-BS2-LabMembers` (GSI含む)
  - **IAMロール:** Lambda関数がDynamoDBとCloudWatch Logsにアクセスするための実行ロールとポリシー
  - **Lambda関数:** `KANKAN-BS2-API` (ビルドしたzipファイルをデプロイ)
  - **API Gateway:** `KANKAN-BS2-HTTP-API` (Lambda関数を公開するHTTPエンドポイント)

## 今後の課題
- APIエンドポイントのデバッグを完了し、Lambda関数が正常に動作することを確認する。
- Slack APIトークンなど、Lambda関数が実行時に必要とする環境変数をセキュアに管理する方法（例: AWS Secrets Manager）を検討する。
- 支払い計算やDM送信のユースケースに対応するAPIエンドポイントを実装する。
- フロントエンドとの連携を進める。