module.exports = {
    name: 'shuffle',
    description: 'Shuffle the Queue!',
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    owner: true,
    async execute(message) {
        const player = message.client.manager.get(message.guild.id);

        if (!player || !player.queue || player.queue.size === 0) {
            return message.reply('There is no music in the queue to shuffle!');
        }

        // Shuffle the queue
        player.queue.shuffle();

        // Send confirmation message
        message.reply({ content: 'The queue has been shuffled!' }).then(msg => {
            setTimeout(() => {
                msg.delete(); // Delete confirmation after 1 second
            }, 3400);
        });
    },
};