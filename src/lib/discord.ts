import {
    Client,
    Collection,
    GatewayIntentBits,
    ChannelType,
} from 'discord.js';

import type { ThreadChannel } from 'discord.js';

import { config } from '../config.js';

import type { GithubIssue, IssueType, Command } from '../types.js';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
export const commands = new Collection<string, Command>();
export async function createThreadForIssue(
    issue: GithubIssue
): Promise<ThreadChannel | null> {
    try {
        const channel = await client.channels.fetch(config.discord.epicChannelId);

        if (!channel || channel.type !== ChannelType.GuildText) {
            throw new Error('Canal não encontrado ou não é um canal de texto');
        }

        const labels = issue.labels.map((l) => l.name).join(', ');
        const issueType = getIssueType(issue);

        const thread = await (channel).threads.create({
            name: `[${issueType.toUpperCase()}] ${issue.title.substring(0, 80)}`,
            autoArchiveDuration: 1440,
        });

        await thread.send(formatIssueMessage(issue, issueType, labels));

        return thread;
    } catch (error) {
        console.error('Erro ao criar thread:', error);
        return null;
    }
}

function getIssueType(issue: GithubIssue): IssueType {
    const label = issue.labels.find((l) =>
        ['epic', 'story'].includes(l.name.toLowerCase())
    );
    return (label?.name.toLowerCase() as IssueType) || 'epic';
}

function formatIssueMessage(
    issue: GithubIssue,
    issueType: IssueType,
    labels: string
): string {
    return `**Nova ${issueType}:** ${issue.title}\n\n${issue.body || 'Sem descrição'
        }\n\n**Labels:** ${labels}\n**GitHub:** ${issue.html_url}`;
}
