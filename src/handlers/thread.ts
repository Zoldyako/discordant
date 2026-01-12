import type { ThreadChannel } from 'discord.js';
import { config } from '../config.js';
import { createIssue } from '../lib/github.js';

export async function handleNewThread(thread: ThreadChannel): Promise<void> {
    try {
        if (thread.parentId !== config.discord.triageChannelId) return;

        const messages = await thread.messages.fetch({ limit: 1 });
        const firstMessage = messages.first();

        if (!firstMessage) return;

        const title = thread.name;
        const body = formatIssueBody(
            firstMessage.author.tag,
            thread.guildId,
            thread.id,
            firstMessage.content
        );

        const issue = await createIssue(
            config.github.publicRepo.owner,
            config.github.publicRepo.repo,
            title,
            body,
            ['triagem', 'discord']
        );

        await thread.send(`✅ Issue criada no GitHub: ${issue.html_url}`);
        console.log(`Issue criada: ${issue.html_url}`);
    } catch (error) {
        console.error('Erro ao processar nova thread:', error);
        await thread.send('❌ Erro ao criar issue no GitHub. Verifique os logs.');
    }
}

function formatIssueBody(
    authorTag: string,
    guildId: string,
    threadId: string,
    content: string
): string {
    return `**Criado por:** ${authorTag}\n**Discord Thread:** https://discord.com/channels/${guildId}/${threadId}\n\n---\n\n${content}`;
}
