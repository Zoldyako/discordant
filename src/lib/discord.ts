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
        console.log(`[Discord] Buscando canal ${config.discord.epicChannelId}...`);
        const channel = await client.channels.fetch(config.discord.epicChannelId);

        if (!channel) {
            throw new Error('Canal não encontrado');
        }

        console.log(`[Discord] Canal encontrado: ${channel.id}, tipo: ${channel.type}`);

        // Verifica permissões do bot no canal
        if ('permissionsFor' in channel) {
            const permissions = channel.permissionsFor(client.user!);
            console.log(`[Discord] Permissões do bot: ${permissions?.toArray().join(', ')}`);
        }

        const labels = issue.labels.map((l) => l.name).join(', ');
        const issueType = getIssueType(issue);
        // Remove o prefixo de tipo do título para evitar duplicação (ex: "⭐ Epic 06:" -> "Epic 06:")
        const cleanTitle = issue.title
            .replace(/^⭐\s*/, '')
            .replace(/^📖\s*/, '')
            .substring(0, 80);
        const threadName = `[${issueType.toUpperCase()}] ${cleanTitle}`;
        const message = formatIssueMessage(issue, issueType, labels);

        let thread: ThreadChannel;

        // Suporte para canais de Fórum
        if (channel.type === ChannelType.GuildForum) {
            // Busca tags disponíveis no fórum e seleciona a apropriada
            const availableTags = channel.availableTags;
            const tagsList = availableTags.map(t => t.name + ' (' + t.id + ')').join(', ');
            console.log('[Discord] Tags disponíveis: ' + tagsList);

            // Tenta encontrar uma tag que corresponda ao tipo da issue
            const tagName = issueType === 'epic' ? 'epic' : 'story';
            let selectedTag = availableTags.find(t =>
                t.name.toLowerCase().includes(tagName) ||
                t.name.toLowerCase().includes(issueType)
            );

            // Se não encontrar, usa a primeira tag disponível
            if (!selectedTag && availableTags.length > 0) {
                selectedTag = availableTags[0];
            }

            const appliedTags = selectedTag ? [selectedTag.id] : [];
            console.log(`[Discord] Tag selecionada: ${selectedTag?.name || 'nenhuma'}`);

            const post = await channel.threads.create({
                name: threadName,
                autoArchiveDuration: 1440,
                message: { content: message },
                appliedTags,
            });
            thread = post;
        }
        // Suporte para canais de texto normais
        else if (channel.type === ChannelType.GuildText) {
            thread = await channel.threads.create({
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
    // Usa o issueType definido na busca (mais confiável)
    if (issue.issueType) {
        return issue.issueType;
    }

    // Fallback: verifica pelo título
    if (issue.title.includes('⭐') || issue.title.toLowerCase().includes('epic')) {
        return 'epic';
    }
    if (issue.title.includes('📖') || issue.title.toLowerCase().includes('story')) {
        return 'story';
    }

    return 'epic';
}

function formatIssueMessage(
    issue: GithubIssue,
    issueType: IssueType,
    labels: string
): string {
    // Remove o prefixo de tipo do título
    const cleanTitle = issue.title
        .replace(/^⭐\s*/, '')
        .replace(/^📖\s*/, '');

    const typeLabel = issueType === 'epic' ? '⭐ Epic' : '📖 Story';
    const labelsLine = labels ? `\n**Labels:** ${labels}` : '';

    return `**${typeLabel}:** ${cleanTitle}\n\n${issue.body || 'Sem descrição'}${labelsLine}\n**GitHub:** ${issue.html_url}`;
}
