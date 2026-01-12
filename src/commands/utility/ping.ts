import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

const command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong!'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('Pong!');
    }
};

export { command };
