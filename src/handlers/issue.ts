import { listIssuesWithLabels, addLabelToIssue } from '../lib/github.js';
import { createThreadForIssue } from '../lib/discord.js';
import { config } from '../config.js';

const SYNCED_LABEL = 'discord-synced';

export async function pollPrivateRepoIssues(): Promise<void> {
    try {
        console.log(`[Polling] Buscando issues em ${config.github.privateRepo.owner}/${config.github.privateRepo.repo}...`);

        const issues = await listIssuesWithLabels(
            config.github.privateRepo.owner,
            config.github.privateRepo.repo,
            ['epic', 'story']
        );

        console.log(`[Polling] ${issues.length} issues encontradas com labels epic/story`);

        for (const issue of issues) {
            const labels = issue.labels.map(l => l.name);
            console.log(`[Polling] Issue #${issue.number}: "${issue.title}" (labels: ${labels.join(', ')})`);

            // Ignora issues já sincronizadas com Discord
            if (labels.some(l => l.toLowerCase() === SYNCED_LABEL)) {
                console.log(`[Polling] Issue #${issue.number} já sincronizada, pulando...`);
                continue;
            }

            console.log(`[Polling] Criando thread para issue #${issue.number}...`);
            const thread = await createThreadForIssue(issue);
            if (thread) {
                await addLabelToIssue(
                    config.github.privateRepo.owner,
                    config.github.privateRepo.repo,
                    issue.number,
                    SYNCED_LABEL
                );
                console.log(`[Polling] ✓ Thread criada e label adicionada: ${issue.title}`);
            } else {
                console.log(`[Polling] ✗ Falha ao criar thread para issue: ${issue.title}`);
            }
        }
    } catch (error) {
        console.error('[Polling] Erro no polling:', error);
    }
}

