# Earnrova — Telegram Mini App starter

Includes:
- Earnrova dark/green interface inspired by the supplied screenshots
- Telegram Mini App shell
- AdsGram Reward integration using Block ID 42106
- 50-ad daily limit
- $0.10 reward per completed ad
- $20 minimum withdrawal
- Telegram initData validation
- Basic balance, referral-link UI, leaderboard placeholder and withdrawal request flow

## Economics
$0.10 × 50 ads/day = $5/day maximum from ads. Therefore ads alone reach $20 in 4 days, not 3. Reaching $20 in 3 days requires additional legitimate rewards/referrals or a different reward rate. Do not promise payouts until actual AdsGram revenue is measured.

## Run
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Put your NEW BotFather token in BOT_TOKEN.
4. Run `npm install` then `npm start`.
5. Deploy over HTTPS before connecting it to Telegram.

## AdsGram
The frontend loads the AdsGram SDK and initializes:
window.Adsgram.init({ blockId: "42106", debug: false })

Use debug mode only for testing. Debug/test impressions do not count as real statistics.

## Telegram
After deployment:
- Configure the Main Mini App or Menu Button in @BotFather with the deployed HTTPS URL.
- Bot: @Earnrova_bot
- Never expose BOT_TOKEN in frontend JavaScript.

## Production requirements
This starter uses a JSON file for persistence and is intended as a prototype. Before real withdrawals/high traffic, use a managed database such as PostgreSQL, add an admin panel and withdrawal review, referral attribution, rate limits/fraud controls, and a server-side reward confirmation approach supported by AdsGram. Do not rely on a client-controlled request alone for high-value payouts.
