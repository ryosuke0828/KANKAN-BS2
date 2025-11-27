# AWS Lambda Node.js 20.x ランタイムをベースイメージとして使用
FROM public.ecr.aws/lambda/nodejs:20

# 作業ディレクトリを設定
WORKDIR /app

# package.json と package-lock.json をコピー
# これにより、依存関係のキャッシュが活用され、ビルドが高速化される
COPY package*.json ./

# 依存関係をインストール
# --production フラグを削除し、すべての依存関係をインストール
RUN dnf install -y zip
RUN npm install

# ソースコードをコピー
COPY . .

# TypeScript コードをビルド
# tsconfig.json の outDir に従って dist ディレクトリにビルドされる
RUN npm run build

# デプロイパッケージを作成
# dist ディレクトリと node_modules を含めて zip 化する
# zip ファイルは /tmp に作成し、後でホストにコピーする
RUN zip -r /tmp/deployment_package.zip dist node_modules

# Lambdaハンドラは dist/presentation/server.handler を想定
# Dockerイメージ自体はLambda関数として直接実行されるわけではないため、CMDは不要
# 最終的な zip ファイルが Lambda にアップロードされる
