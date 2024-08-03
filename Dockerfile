# Node.jsの公式イメージをベースにします
FROM node:20

# アプリケーションディレクトリを作成します
WORKDIR /usr/src/app

# アプリケーションの依存関係ファイルをコピーします
COPY package*.json ./

# 依存関係をインストールします
RUN npm install

# アプリケーションのソースをコピーします
COPY . .

# TypeScriptをコンパイルします
RUN npm run build

# アプリケーションが使用するポートを指定します
EXPOSE 8080

# アプリケーションを実行します
CMD [ "node", "dist/index.js" ]
