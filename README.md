# Spotlite

Spotlite is a powerful analytics and creator marketplace platform built on Zora and Farcaster. It helps creators understand their coin performance and connects them with brands for sponsored content opportunities.

## Key Features

### Creator Analytics
- Track and analyze Zora coin performance
- Understand content engagement and trends
- Make data-driven decisions about content strategy

### Creator Profiles
- Showcase creator portfolio and performance metrics
- Build credibility and attract potential sponsors
- Discover other creators and their success stories

### Sponsored Content Marketplace
- Connect with brands for sponsored content opportunities
- Manage sponsored post requests directly in Warpcast
- Secure USDC payments for sponsored content
- Streamlined workflow for accepting/rejecting sponsored posts

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. Verify environment variables, these will be set up by the `npx create-onchain --mini` command:

You can regenerate the FARCASTER Account Assocation environment variables by running `npx create-onchain --manifest` in your project directory.

The environment variables enable the following features:

- Frame metadata - Sets up the Frame Embed that will be shown when you cast your frame
- Account assocation - Allows users to add your frame to their account, enables notifications
- Redis API keys - Enable Webhooks and background notifications for your application by storing users notification details

```bash
# Required for Frame metadata
NEXT_PUBLIC_URL=
NEXT_PUBLIC_VERSION=
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_ICON_URL=
NEXT_PUBLIC_IMAGE_URL=
NEXT_PUBLIC_SPLASH_IMAGE_URL=
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=

# Required to allow users to add your frame
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=

# Required for webhooks and background notifications
REDIS_URL=
REDIS_TOKEN=
```

3. Start the development server:
```bash
npm run dev
```

## Technical Stack

- [Next.js](https://nextjs.org/docs)
- [MiniKit](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit](https://www.base.org/builders/onchainkit)
- [Tailwind CSS](https://tailwindcss.com)
- [Zora Coins SDK](https://docs.zora.co/coins/overview)
- [Farcaster Frame SDK](https://docs.farcaster.xyz/reference/frames)

## Template Features

### Frame Configuration
- `.well-known/farcaster.json` endpoint configured for Frame metadata and account association
- Frame metadata automatically added to page headers in `layout.tsx`

### Background Notifications
- Redis-backed notification system using Upstash
- Ready-to-use notification endpoints in `api/notify` and `api/webhook`
- Notification client utilities in `lib/notification-client.ts`

### Theming
- Custom theme defined in `theme.css` with OnchainKit variables
- Pixel font integration with Pixelify Sans
- Dark/light mode support through OnchainKit

### MiniKit Provider
The app is wrapped with `MiniKitProvider` in `providers.tsx`, configured with:
- OnchainKit integration
- Access to Frames context
- Sets up Wagmi Connectors
- Sets up Frame SDK listeners
- Applies Safe Area Insets

## Customization

To get started building your own frame, follow these steps:

1. Remove the DemoComponents:
   - Delete `components/DemoComponents.tsx`
   - Remove demo-related imports from `page.tsx`

2. Start building your Frame:
   - Modify `page.tsx` to create your Frame UI
   - Update theme variables in `theme.css`
   - Adjust MiniKit configuration in `providers.tsx`

3. Add your frame to your account:
   - Cast your frame to see it in action
   - Share your frame with others to start building your community

## Learn More

- [Zora Documentation](https://docs.zora.co)
- [Farcaster Documentation](https://docs.farcaster.xyz)
- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
