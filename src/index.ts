import { App, ExpressReceiver } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getConversationHistory(client: WebClient, channel: string, threadTs: string) {
  const result = await client.conversations.replies({
    channel: channel,
    ts: threadTs,
  });

  return (
    result.messages?.map((msg) => ({
      role: msg.bot_id ? 'assistant' : 'user',
      content: msg.text,
    })) || []
  );
}

function removeMarkdown(text: string): string {
  // 見出し
  text = text.replace(/^#+\s/gm, '');
  // 太字と斜体
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  // インラインコード
  text = text.replace(/`([^`]+)`/g, '$1');
  // コードブロック
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```/g, '').trim();
  });
  // リンク
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  // 箇条書き
  text = text.replace(/^[-*+]\s/gm, '• ');
  // 番号付きリスト
  text = text.replace(/^\d+\.\s/gm, '');
  // 水平線
  text = text.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '---');

  return text.trim();
}

async function showTypingIndicator(
  client: WebClient,
  channel: string,
  thread_ts: string
): Promise<string | undefined> {
  try {
    const result = await client.chat.postMessage({
      channel: channel,
      text: '考え中...',
      thread_ts: thread_ts,
    });
    return result.ts;
  } catch (error) {
    console.error('Error showing typing indicator:', error);
    return undefined;
  }
}

async function hideTypingIndicator(client: WebClient, channel: string, ts: string) {
  try {
    await client.chat.delete({
      channel: channel,
      ts: ts,
    });
  } catch (error) {
    console.error('Error hiding typing indicator:', error);
  }
}

async function handleMessage(event: any, context: any, client: WebClient, say: any) {
  let typingTs: string | undefined;
  try {
    const threadTs = (event as any).thread_ts || event.ts;
    const userMessage = event.text;

    if (event.bot_id) {
      return;
    }

    if (event.thread_ts) {
      typingTs = await showTypingIndicator(client, event.channel, threadTs);
    }

    const conversationHistory = await getConversationHistory(client, event.channel, threadTs);

    const messages = [
      {
        role: 'system',
        content:
          'あなたは丁寧で親切なアシスタントです。通常のマークダウン記法を使用して回答してください。',
      },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ] as OpenAI.Chat.ChatCompletionMessageParam[];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
    });

    let botResponse = completion.choices[0].message.content;

    if (botResponse) {
      // コードブロックの処理（変更なし）
      botResponse = botResponse.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        lang = lang || '';
        return '```' + lang + '\n' + code.trim() + '\n```';
      });

      // 見出しを太字に変換
      botResponse = botResponse.replace(/^(#{1,6})\s+(.+)$/gm, '*$2*\n');

      // 太字をノーマルテキストに変換（見出し以外）
      botResponse = botResponse.replace(/(?<!^)\*\*(.*?)\*\*/g, '$1');

      // 箇条書きをSlackフォーマットに変換
      botResponse = botResponse.replace(/^[-*+]\s+/gm, '• ');

      // 番号付きリストをSlackフォーマットに変換
      botResponse = botResponse.replace(/^(\d+)\.?\s+/gm, '$1. ');

      // リンクの処理
      botResponse = botResponse.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 $2');

      if (typingTs) {
        await hideTypingIndicator(client, event.channel, typingTs);
      }

      await say({
        text: botResponse,
        thread_ts: threadTs,
      });
    }
  } catch (error) {
    console.error(error);
    if (typingTs) {
      await hideTypingIndicator(client, event.channel, typingTs);
    }
  }
}

// app_mention イベントハンドラ
app.event('app_mention', async ({ event, context, client, say }) => {
  try {
    // 👀 の絵文字リアクションを追加（初回メンション時のみ）
    if (!event.thread_ts) {
      await client.reactions.add({
        channel: event.channel,
        timestamp: event.ts,
        name: 'eyes',
      });
    }
    await handleMessage(event, context, client, say);
  } catch (error) {
    console.error('Error handling app_mention event:', error);
  }
});

// message イベントハンドラ（スレッド内のメッセージ用）
app.message(async ({ message, context, client, say }) => {
  // TypeScriptの型チェックを回避するために型アサーションを使用
  const messageWithThread = message as { thread_ts?: string };

  // スレッド内のメッセージのみに反応
  if (messageWithThread.thread_ts) {
    await handleMessage(message, context, client, say);
  }
});

(async () => {
  await app.start(process.env.PORT || 8080);
  console.log('⚡️ Bolt app is running!');
})();
