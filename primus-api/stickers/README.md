# Stickers Folder

This folder contains animated stickers/GIFs for the Telegram bot.

## Current Stickers

### welcome.webp
- **Use**: Sent on /start command
- **Status**: Needs to be moved from `primus-api/welcome.webp` to this folder

## To Add (See INTELLIGENT_BOT_UPGRADE_PLAN.md for generation prompts)

- analyzing.webp - Shown during analysis
- analysis_complete.webp - Success indicator
- valid_setup.webp - Valid setup badge
- invalid_setup.webp - Setup needs review
- chart_generating.webp - Chart generation
- thinking.webp - AI thinking (new feature)
- question_received.webp - Question confirmation
- profile_loading.webp - Profile stats loading
- market_open.webp - Market selection
- error.webp - Technical issues
- logout.webp - Goodbye message

## File Requirements

- **Format**: WebP (animated) or Telegram sticker format
- **Size**: 512x512px (Telegram sticker size)
- **Colors**: Match Primus GPT brand (orange #FF6B35 to purple gradient)
- **Background**: Transparent or subtle dark gradient
- **Duration**: 1-3 seconds
- **Style**: Professional, corporate, modern

## Usage in Bot

```javascript
const stickerPath = path.join(__dirname, '../stickers/welcome.webp');
if (fs.existsSync(stickerPath)) {
  await bot.sendSticker(chatId, stickerPath);
}
```

## Next Steps

1. Move existing `welcome.webp` to this folder
2. Update telegramBot.js paths to use `../stickers/`
3. Generate remaining stickers using prompts from plan
4. Test all stickers in Telegram
