# Prediction Reels

A fast-paced, mobile-first prediction market platform inspired by TikTok/Instagram Reels. Swipe right to bet UP, swipe left to bet DOWN on crypto price movements.

## Features

- **Swipeable Cards**: Tinder/TikTok-style interface for making predictions
- **Auto-Scroll**: Automatically moves to the next prediction after 60 seconds
- **Real-time Countdown**: Visual timer showing time remaining for each bet
- **Pool Information**: Live multipliers and pool sizes for UP/DOWN bets
- **Mobile-Optimized**: Designed specifically for phone aspect ratios
- **Modern UI**: Clean, minimal design with smooth animations

## How to Use

1. **Swipe Right**: Predict the price will go UP
2. **Swipe Left**: Predict the price will go DOWN
3. **Wait**: If you don't swipe, it auto-scrolls to the next prediction after 60 seconds

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **Framer Motion** for smooth animations and gesture handling
- **Lucide React** for icons

## Getting Started

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
prediction-reels/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Main page with card stack logic
│   └── globals.css      # Global styles
├── components/
│   ├── ui/
│   │   └── card.tsx     # Base Card UI component
│   └── PredictionCard.tsx  # Main swipeable prediction card
├── types/
│   └── prediction.ts    # TypeScript type definitions
├── data/
│   └── mockPredictions.ts  # Mock prediction data
└── lib/
    └── utils.ts         # Utility functions (cn)
\`\`\`

## Customization

### Modify Bet Duration

Edit the timeout in `app/page.tsx`:

\`\`\`typescript
autoScrollTimerRef.current = setTimeout(() => {
  handleNextCard();
}, 60000); // Change this value (in milliseconds)
\`\`\`

### Add More Predictions

Edit `data/mockPredictions.ts` to add more crypto assets or modify existing ones.

### Swipe Threshold

Adjust the swipe sensitivity in `components/PredictionCard.tsx`:

\`\`\`typescript
const threshold = 100; // Pixels needed to trigger swipe
\`\`\`

## Future Enhancements

- Connect to real crypto price APIs
- Implement actual betting with Web3 wallet integration
- Add result tracking and win/loss history
- Leaderboard system
- Social sharing features
- Sound effects and haptic feedback
- Multi-timeframe options (30s, 1m, 5m)

## License

MIT
