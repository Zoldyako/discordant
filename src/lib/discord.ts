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

        if (!channel) {
            throw new Error('Canal não encontrado');
        }

        const labels = issue.labels.map((l) => l.name).join(', ');
        const issueType = getIssueType(issue);
        const threadName = `[${issueType.toUpperCase()}] ${issue.title.substring(0, 80)}`;
        const message = formatIssueMessage(issue, issueType, labels);

        let thread: ThreadChannel;

        // Suporte para canais de Fórum
        if (channel.type === ChannelType.GuildForum) {
            const forumChannel = channel;
            const post = await forumChannel.threads.create({
                name: threadName,
                autoArchiveDuration: 1440,
                message: { content: message },
            });
            thread = post;
        }
        // Suporte para canais de texto normais
        else if (channel.type === ChannelType.GuildText) {
            const textChannel = channel;
            thread = await textChannel.threads.create({
                name: threadName,
                autoArchiveDuration: 1440,
            });
            await thread.send(message);
        }
        else {
            throw new Error(`Tipo de canal não suportado: ${channel.type}`);
        }

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
