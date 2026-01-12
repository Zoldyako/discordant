import dotenv from 'dotenv';
dotenv.config();

export const config = {
    discord: {
        token: process.env.DISCORD_TOKEN!,
        clientId: process.env.CLIENT_ID!,
        guildId: process.env.GUILD_ID!,
        triageChannelId: process.env.TRIAGE_CHANNEL_ID!,
        epicChannelId: process.env.EPIC_CHANNEL_ID!,
    },
    github: {
        token: process.env.GITHUB_TOKEN!,
        projectId: process.env.GITHUB_PROJECT_ID,
        publicRepo: {
            owner: process.env.PUBLIC_REPO_OWNER!,
            repo: process.env.PUBLIC_REPO_NAME!,
        },
        privateRepo: {
            owner: process.env.PRIVATE_REPO_OWNER!,
            repo: process.env.PRIVATE_REPO_NAME!,
        },
    },
} as const;
