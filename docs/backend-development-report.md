
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

---


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

# バックエンド開発レポート (2025年11月13日)

## 概要
本日は、前回からの課題であったSlack APIトークンの暗号化・復号処理のテスト環境構築と、それに伴うTypeScriptプロジェクトのESM対応、およびテストの簡素化を行いました。Jestの複雑な設定を避け、Node.jsの組み込み機能とTypeScriptコンパイラを活用したシンプルなユニットテスト環境を構築し、テストがすべて成功することを確認しました。

## 作業内容

### 1. テスト環境の再構築とESM対応
- **JestのESM問題への対応と断念:**
  - 前回、`uuid`パッケージのESM形式に起因する`SyntaxError: Unexpected token 'export'`エラーが発生し、JestでのESM対応に苦慮しました。`jest.config.js`の`type: "module"`や`ts-jest/presets/default-esm`、`babel-jest`の導入など様々なアプローチを試みましたが、TypeScriptのコンパイルエラーやNode.jsのランタイムエラーが頻発し、安定したテスト環境を構築できませんでした。
  - 特に、`package.json`の`"type": "module"`設定とJestのCommonJSベースの動作の間の不整合、および`node_modules`内のESMモジュールをJestのトランスフォーマーで適切に処理することの複雑さが大きな障壁となりました。度重なる設定変更にも関わらず、テストに本質的に関係ない部分でのエラーが解消されず、開発効率を著しく低下させる結果となりました。
  - このため、Jestの利用を断念し、よりシンプルなテスト手法への移行を決定しました。
- **シンプルなユニットテストへの移行:**
  - Jestの複雑な設定から離れ、Node.jsの`assert`モジュールとTypeScriptコンパイラ(`tsc`)を直接利用するシンプルなユニットテスト環境へ移行する方針を決定しました。
  - `backend/tests/repositories/UserRepositoryImpl.test.ts` (Jest用) を削除し、`backend/tests/repositories/UserRepositoryImpl.simple.test.ts` を新規作成しました。このテストファイルは、`UserRepositoryImpl`の外部依存（DynamoDBクライアント、KMSクライアント）をモック化し、暗号化・復号ロジックのユニットテストに焦点を当てています。
- **TypeScriptプロジェクトのESM対応の完了:**
  - `package.json`の`"type": "module"`設定を維持しつつ、`tsconfig.json`の`compilerOptions.module`を`NodeNext`に、`compilerOptions.moduleResolution`も`NodeNext`に設定しました。これにより、TypeScriptコンパイラがESMの解決ルールに従うようになりました。
  - `tsconfig.json`から`baseUrl`と`paths`の設定を削除し、`tsc-alias`への依存を解消しました。
  - プロジェクト内のすべての相対インポートパス（例: `../../domain/entities/User`）に明示的に`.js`拡張子を追加しました（例: `../../domain/entities/User.js`）。これはESM環境におけるNode.jsのモジュール解決ルールに準拠するためです。
  - `uuid`パッケージのインポートも、型定義の問題を避けるため、`import { v4 as uuidv4 } from 'uuid';` の形式に戻しました。
- **不要なパッケージと設定のクリーンアップ:**
  - `backend/jest.config.js`を削除しました。
  - `backend/package.json`からJest関連の依存関係（`jest`, `ts-jest`, `@types/jest`, `babel-jest`, `@babel/core`, `@babel/preset-env`）とスクリプト（`test`）を削除しました。
  - `tsc-alias`と`tsconfig-paths`をアンインストールし、`package.json`の`build`スクリプトから`tsc-alias`の実行を削除しました。
- **テストスクリプトの追加:**
  - `package.json`に`"test:unit": "npm run build && node dist/tests/repositories/UserRepositoryImpl.simple.test.js"`スクリプトを追加しました。これにより、TypeScriptファイルのコンパイルと、コンパイル済みJavaScriptテストファイルの実行を一度に行えるようになりました。

### 2. テスト結果
- 上記の変更後、`npm run test:unit`を実行したところ、`UserRepositoryImpl`の暗号化・復号ロジックに関するすべてのテストが成功しました。これにより、Slack APIトークンのアダプタ層での暗号化・復号処理が期待通りに機能していることを確認できました。

## 今後の課題
- APIエンドポイントのデバッグを完了し、Lambda関数が正常に動作することを確認する。
- Slack APIトークンなど、Lambda関数が実行時に必要とする環境変数をセキュアに管理する方法（例: AWS Secrets Manager）を検討する。
- 支払い計算やDM送信のユースケースに対応するAPIエンドポイントを実装する。
- フロントエンドとの連携を進める。

---

# バックエンド開発レポート (2025年11月13日 - 続き)

## 概要
本日は、LabメンバーのCRUD操作機能と、メンバーの進級時のBulkUpdateエンドポイントの実装を行いました。また、要件定義書にユーザーからのフィードバックを反映させ、支払い計算ロジックの修正も完了しました。

## 作業内容

### 1. APIエンドポイント要件定義書の更新
- `docs/requirements/api-endpoints.md`に、LabメンバーのCRUD操作とBulkUpdateエンドポイントに関するユーザーからのフィードバックを反映させました。
  - `attribute`の取り得る値、`LabMember`作成時の`userId`の取得元、進級ルールの厳密な適用、BulkUpdateの対象範囲、レスポンス形式（サマリーで十分）などが明確になりました。

### 2. PaymentCalculatorロジックの修正
- 支払い計算の端数処理に関する新しい要件を`backend/domain/services/PaymentCalculator.ts`に実装しました。
  - 全体の金額を10円単位で切り上げ、同じ`attribute`のメンバーには同じ金額を割り当て、支払い金額は10円単位で不足する場合は切り上げるロジックを導入しました。

### 3. Labメンバー関連ユースケースの実装
- 以下のユースケースを`backend/application/usecases/`ディレクトリに実装しました。
  - `CreateLabMember.ts`: Labメンバーの作成
  - `GetLabMember.ts`: Labメンバーの取得
  - `UpdateLabMember.ts`: Labメンバーの更新
  - `DeleteLabMember.ts`: Labメンバーの削除
  - `BulkUpdateLabMembersAttribute.ts`: Labメンバーの属性を一括で進級させるロジック（進級ルールと制約を考慮）

### 4. Labメンバー関連APIエンドポイントの実装
- `backend/presentation/routes/labMemberRoutes.ts`を作成し、以下のAPIエンドポイントを実装しました。
  - `POST /api/v1/lab-members`: Labメンバーの作成
  - `GET /api/v1/lab-members/:id`: Labメンバーの取得
  - `PUT /api/v1/lab-members/:id`: Labメンバーの更新
  - `DELETE /api/v1/lab-members/:id`: Labメンバーの削除
  - `POST /api/v1/lab-members/bulk-update-attribute`: Labメンバーの属性を一括で進級

### 5. ルーティングの追加
- `backend/presentation/server.ts`に`labMemberRoutes`のルーティングを追加しました。

## 進捗 (100分率)
- **全体的な機能実装:** 約 70%

## 次のおすすめ作業 (3択)
1.  **既存の `/collect-from-slack` エンドポイントのデバッグと動作確認:**
    *   Lambdaにデプロイし、実際にリクエストを送信して、期待通りに動作することを確認します。これにより、アプリケーションの基本的な動作が保証されます。
2.  **認証・認可機能の検討と実装:**
    *   現在のAPIエンドポイントは認証なしでアクセス可能ですが、セキュリティを考慮すると認証・認可機能の実装が不可欠です。ユーザー管理機能と連携し、APIキー、JWT、またはAWS Cognitoなどの導入を検討します。
3.  **フロントエンドとの連携の開始:**
    *   バックエンドの主要なAPIエンドポイントが揃ったため、フロントエンドチームと連携し、APIの仕様を共有し、フロントエンドからの呼び出しをテストし始めることができます。

---

## 2025-11-14: アプリケーション層の整理とテスト可能なアーキテクチャへのリファクタリング

### 本日の作業概要

- **`application`層の整理**: `application/usecases` ディレクトリ内の各ユースケースを、関連するドメイン（`lab-member`, `payment`, `slack`）ごとにサブディレクトリへ移動し、構成を整理しました。
- **エンドポイントテストの導入**:
    - エンドポイントのテストを効率化するため、`supertest`ライブラリを導入しました。
    - 当初、テストランナーとして`Jest`の導入を試みましたが、プロジェクトのESM（ECMAScript Modules）設定との互換性問題の解決に時間がかかったため、導入を断念しました。
    - 代わりに、プロジェクトの既存のテストスタイルを踏襲し、`tsc`でコンパイルしたテストファイルを`node`で直接実行する方式を採用しました。

### アーキテクチャの改善：依存性の注入（DI）の導入

#### 以前のアーキテクチャの問題点

以前の設計では、`presentation`層のルーター（例: `labMemberRoutes.ts`）が、`infrastructure`層のリポジトリ実装（例: `LabMemberRepositoryImpl`）を直接インスタンス化していました。
このアプローチは、`presentation`層と`infrastructure`層の間に強い結合を生み出しており、以下の問題点がありました。

- **テスト容易性の欠如**: レイヤーが密結合しているため、テスト時にデータベースアクセスを行うリポジトリを偽のオブジェクト（モック）に差し替えることが困難でした。これにより、テストが外部環境（データベース）に依存してしまい、不安定で実行速度の遅いものになるリスクがありました。
- **責務の不分離**: `presentation`層が依存関係の解決という責務まで負ってしまい、コードの見通しが悪化していました。

#### 新しいアーキテクチャと変更理由

ドメイン駆動設計の「関心の分離」の原則に基づき、`presentation`層が具象クラス（実装）ではなく、`domain`層のインターフェースにのみ依存するようにアーキテクチャをリファクタリングしました。

具体的には、**依存性の注入（DI: Dependency Injection）** パターンを導入しました。

1.  各ルーターファイルを、リポジトリのインターフェースを引数として受け取る**ファクトリ関数**（例: `createLabMemberRouter`）に変更しました。
2.  アプリケーションのエントリーポイントである`presentation/server.ts`で、`infrastructure`層のリポジトリ実装を一度だけインスタンス化し、それらを各ルーターのファクトリ関数に注入（DI）してルーターを生成するように変更しました。

この変更により、`presentation`層は「どのようなリポジトリが使われるか」を知る必要がなくなり、`domain`層で定義された「リポジトリという役割（インターフェース）」にのみ依存する、よりクリーンなアーキテクチャになりました。

#### 改善によるメリット

- **テスト容易性の向上**: テスト時には、本物のリポジトリの代わりに、テスト用に作成したモックオブジェクトを簡単に注入できるようになりました。これにより、外部環境から独立した、高速で信頼性の高い単体テスト・結合テストが可能になります。
- **メンテナンス性と拡張性の向上**: 依存関係が一箇所（`server.ts`）で管理されるため、将来的にリポジトリの実装を別のもの（例: 別のデータベース）に切り替える際も、変更箇所を最小限に抑えることができます。

### 本日の具体的な成果

- `labMemberRoutes.ts`, `memberRoutes.ts`, `paymentRoutes.ts` のすべてにDIパターンを適用しました。
- `labMemberRoutes`の`POST /api/v1/lab-members`エンドポイントに対するテストコード (`tests/routes/labMemberRoutes.test.ts`) を作成しました。
- 作成したテストが、リポジトリのモックを使って正常に実行され、成功することを確認しました。
