# claude-discord-mcp

Claude CodeからDiscordを直接操作できるMCPサーバーです。

## セットアップ

### 1. Discord Botの作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. **New Application** をクリック → 名前を入力して作成
3. 左メニュー **Bot** をクリック

### 2. Privileged Gateway Intentsの有効化

Botページの **Privileged Gateway Intents** セクションで、以下の3つをONにしてください：

- **SERVER MEMBERS INTENT** — メンバー一覧の取得に必要
- **MESSAGE CONTENT INTENT** — メッセージ内容の読み取りに必要

※ PRESENCE INTENTは任意です

### 3. Botトークンの取得

Botページの **Token** セクションで：

1. **Reset Token** をクリック
2. 表示されたトークンをコピー（一度しか表示されません）

### 4. Botをサーバーに招待

1. 左メニュー **OAuth2** をクリック
2. **OAuth2 URL Generator** セクションの **SCOPES** で `bot` にチェック
3. **BOT PERMISSIONS** で以下にチェック：
   - チャンネルを表示
   - メッセージを送る
   - 公開スレッドを作成
   - プライベートスレッドを作成
   - Threadsでメッセージを送る
   - メッセージを管理
   - メッセージ履歴を読む
   - リアクションを付ける
4. ページ下部の **生成されたURL** をブラウザで開く
5. 招待先のサーバーを選んで認証

### 5. Claude Codeに登録

ターミナルで以下を実行（`あなたのBotトークン` を手順3で取得したトークンに置き換え）：

```bash
claude mcp add-json discord-mcp "{\"type\":\"stdio\",\"command\":\"npx\",\"args\":[\"claude-discord-mcp\"],\"env\":{\"DISCORD_BOT_TOKEN\":\"あなたのBotトークン\"}}"
```

または `~/.claude.json` に直接追記：

```json
{
  "mcpServers": {
    "discord-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["claude-discord-mcp"],
      "env": {
        "DISCORD_BOT_TOKEN": "あなたのBotトークン"
      }
    }
  }
}
```

### 6. 動作確認

Claude Codeを再起動して、`/mcp` で `discord-mcp` が connected になっていればOKです。

## 使えるツール（16種類）

| カテゴリ | ツール | 説明 |
|---------|--------|------|
| サーバー | `discord_list_guilds` | Bot参加中のサーバー一覧 |
| | `discord_get_guild_info` | サーバー詳細情報 |
| チャンネル | `discord_list_channels` | チャンネル一覧 |
| | `discord_get_channel_info` | チャンネル詳細情報 |
| メッセージ | `discord_send_message` | メッセージ送信 |
| | `discord_read_messages` | メッセージ取得 |
| | `discord_reply_message` | メッセージに返信 |
| | `discord_delete_message` | メッセージ削除 |
| リアクション | `discord_add_reaction` | リアクション追加 |
| | `discord_get_reactions` | リアクション取得 |
| スレッド | `discord_create_thread` | スレッド作成 |
| | `discord_list_threads` | スレッド一覧 |
| | `discord_send_thread_message` | スレッドにメッセージ送信 |
| ユーザー | `discord_list_members` | メンバー一覧 |
| ロール | `discord_list_roles` | ロール一覧 |
| | `discord_get_role_members` | ロールのメンバー一覧 |

## 使い方の例

Claude Codeで自然言語で頼むだけです：

- 「Discordのサーバー一覧を見せて」
- 「#generalの最新メッセージ20件読んで」
- 「#generalに『お疲れ様です』と送って」
- 「そのメッセージに👍つけて」
- 「サーバーのメンバー一覧教えて」

## ライセンス

MIT
