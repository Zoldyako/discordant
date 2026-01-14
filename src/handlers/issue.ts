import { listIssuesWithTypes, addLabelToIssue, removeLabelFromIssue } from '../lib/github.js';
import { createThreadForIssue } from '../lib/discord.js';
import { config } from '../config.js';
import type { GithubIssue } from '../types.js';

const { epic: EPIC_TYPE, story: STORY_TYPE } = config.github.types;
const { synced: SYNCED_LABEL, ignored: IGNORED_LABELS } = config.github.labels;

// Cooldown para issues que falharam (evita retry a cada polling)
const failedIssues = new Map<number, { count: number; nextRetry: number }>();
const MAX_RETRIES = 3;
// 5 minutos em milissegundos
const BASE_COOLDOWN_MS = 5 * 60 * 1000;

export async function pollPrivateRepoIssues(): Promise<void> {
    if (!config.discord.autoSyncEnabled) {
        console.log('[Polling] Auto-sync desabilitado, pulando polling...');
        return;
    }

    try {
        console.log(`[Polling] Buscando issues em ${config.github.privateRepo.owner}/${config.github.privateRepo.repo}...`);

        const issues = await listIssuesWithTypes(
            config.github.privateRepo.owner,
            config.github.privateRepo.repo,
            [EPIC_TYPE, STORY_TYPE]
        );

        console.log(`[Polling] ${issues.length} issues encontradas com types epic/story`);

        for (const issue of issues) {
            await processIssue(issue);
        }
    } catch (error) {
        console.error('[Polling] Erro no polling:', error);
    }
}

async function processIssue(issue: GithubIssue): Promise<void> {
    const labels = issue.labels.map(l => l.name);
    console.log(`[Polling] Issue #${issue.number}: "${issue.title}" (labels: ${labels.join(', ')})`);

    if (shouldSkipIssue(issue.number, labels)) {
        return;
    }

    try {
        await syncIssueToDiscord(issue);
    } catch (error) {
        console.error(`[Polling] Erro ao processar issue #${issue.number}:`, error);
        await tryRemoveLabel(issue.number);
        registerFailure(issue.number);
    }
}

function shouldSkipIssue(issueNumber: number, labels: string[]): boolean {
    // Ignora issues já sincronizadas com Discord
    if (labels.includes(SYNCED_LABEL)) {
        console.log(`[Polling] Issue #${issueNumber} já sincronizada, pulando...`);
        return true;
    }

    // Ignora issues com labels na lista de ignoradas
    const ignoredLabel = labels.find(l =>
        IGNORED_LABELS.some(ignored => l.toLowerCase() === ignored.toLowerCase())
    );
    if (ignoredLabel) {
        console.log(`[Polling] Issue #${issueNumber} tem label ignorada "${ignoredLabel}", pulando...`);
        return true;
    }

    // Verifica cooldown para issues que falharam anteriormente
    const failedInfo = failedIssues.get(issueNumber);
    if (failedInfo) {
        if (failedInfo.count >= MAX_RETRIES) {
            console.log(`[Polling] Issue #${issueNumber} atingiu máximo de tentativas, ignorando...`);
            return true;
        }
        if (Date.now() < failedInfo.nextRetry) {
            console.log(`[Polling] Issue #${issueNumber} em cooldown, pulando...`);
            return true;
        }
    }

    return false;
}

async function syncIssueToDiscord(issue: GithubIssue): Promise<void> {
    // Adiciona label ANTES de criar thread para evitar race condition
    console.log(`[Polling] Adicionando label de sync para issue #${issue.number}...`);
    await addLabelToIssue(
        config.github.privateRepo.owner,
        config.github.privateRepo.repo,
        issue.number,
        SYNCED_LABEL
    );

    console.log(`[Polling] Criando thread para issue #${issue.number}...`);
    const thread = await createThreadForIssue(issue);

    if (thread) {
        console.log(`[Polling] ✓ Thread criada: ${issue.title}`);
        // Limpa registro de falha se existir
        failedIssues.delete(issue.number);
    } else {
        // Thread não foi criada, remove a label para permitir retry
        console.log(`[Polling] ✗ Falha ao criar thread, removendo label...`);
        await removeLabelFromIssue(
            config.github.privateRepo.owner,
            config.github.privateRepo.repo,
            issue.number,
            SYNCED_LABEL
        );
        registerFailure(issue.number);
    }
}

async function tryRemoveLabel(issueNumber: number): Promise<void> {
    try {
        await removeLabelFromIssue(
            config.github.privateRepo.owner,
            config.github.privateRepo.repo,
            issueNumber,
            SYNCED_LABEL
        );
    } catch {
        // Ignora erro ao remover label
    }
}

function registerFailure(issueNumber: number): void {
    const current = failedIssues.get(issueNumber) || { count: 0, nextRetry: 0 };
    const newCount = current.count + 1;
    // Exponential backoff: 5min, 10min, 20min...
    const cooldown = BASE_COOLDOWN_MS * Math.pow(2, newCount - 1);
    failedIssues.set(issueNumber, {
        count: newCount,
        nextRetry: Date.now() + cooldown,
    });
    console.log(`[Polling] Issue #${issueNumber} falhou (tentativa ${newCount}/${MAX_RETRIES}), próximo retry em ${cooldown / 60000} min`);
}

