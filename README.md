# Slack ChatGPT Bot

Slack ChatGPT Bot は、OpenAI の GPT-4 を利用したSlackのボットです。<br>
ユーザーからの質問に対して、自然言語で回答し、コードスニペットや説明を提供します。

## 主な機能

- Slack チャンネル内でのメンションに応答
- スレッド内での会話のサポート
- コードブロック、リスト、見出しなどの適切なフォーマット
- タイピングインジケーターによる応答生成中の視覚的フィードバック

## 前提条件

- Node.js (バージョン 20 以上)
- npm (Node.js に付属)
- Slack ワークスペースと管理者権限
- OpenAI API キー

## セットアップ

1. リポジトリをクローンします：

   ```
   git clone https://github.com/your-username/slack-chatgpt-bot.git
   cd slack-chatgpt-bot
   ```

2. 依存関係をインストールします：

   ```
   npm install
   ```

3. `.env`ファイルを作成し、必要な環境変数を設定します：

   ```
   SLACK_SIGNING_SECRET=your_slack_signing_secret
   SLACK_BOT_TOKEN=your_slack_bot_token
   OPENAI_API_KEY=your_openai_api_key
   ```

4. アプリケーションをビルドします：

   ```
   npm run build
   ```

5. アプリケーションを起動します：
   ```
   npm start
   ```

## Slack アプリの設定

1. [Slack API](https://api.slack.com/apps)にアクセスし、新しいアプリを作成します。
2. 「Bot Token Scopes」に必要な権限を追加します（例：app_mentions:read, chat:write）。
3. アプリをワークスペースにインストールします。
4. イベントサブスクリプションを有効にし、要求 URL を設定します。
5. 「Subscribe to bot events」で`app_mention`と`message.channels`イベントを追加します。

## 使用方法

1. ボットを Slack チャンネルに招待します。
2. ボットにメンションして質問や指示を送信します：
   ```
   @ChatGPT Bot Pythonについて教えてください。
   ```
3. ボットが応答を生成し、適切にフォーマットされた回答を提供します。
4. スレッド内で会話を続けることができます。
