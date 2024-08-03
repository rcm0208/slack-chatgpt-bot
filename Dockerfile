FROM node:20

WORKDIR /usr/src/app

# すべてのファイルをコピー
COPY . .

# 依存関係のインストール
RUN npm install

# TypeScriptのビルド
RUN npm run build

EXPOSE 8080

CMD [ "node", "dist/index.js" ]
