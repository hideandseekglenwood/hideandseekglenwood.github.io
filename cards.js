const CARD_DATA = [
    // 10 Curses
    {
        id: 'curse_wandering',
        type: 'Curse',
        title: 'Curse of the Wandering Streets',
        description: 'Seekers cannot enter new streets without rolling 7+ on 2 dice. If fail, wait 5 mins.',
        cost: 'Discard 3 cards',
        count: 1
    },
    {
        id: 'curse_relocation',
        type: 'Curse',
        title: 'Curse of the Unexpected Relocation',
        description: 'Choose a public place within 100m of seekers. They must go there and wait 5 mins.',
        cost: 'Choose a location',
        count: 1
    },
    {
        id: 'curse_twisted',
        type: 'Curse',
        title: 'Curse of the Twisted Path',
        description: 'For the next 15 minutes, seekers must roll the die to see what direction to go.',
        cost: 'Next seeker question is free',
        count: 1
    },
    {
        id: 'curse_luxury',
        type: 'Curse',
        title: 'Curse of the Luxury Hunt',
        description: 'Take a photo of a car. Seekers must find a more expensive one.',
        cost: 'A photo of a car',
        count: 1
    },
    {
        id: 'curse_bird',
        type: 'Curse',
        title: 'Curse of the Watchful Bird',
        description: 'Seekers must watch a bird for 20s. If it flies, restart.',
        cost: 'Watch a bird for 15s',
        count: 1
    },
    {
        id: 'curse_stagnant',
        type: 'Curse',
        title: 'Curse of the Stagnant Steps',
        description: 'Seekers roll dice for steps. Roll 5 -> Take 5 steps.',
        cost: 'Seekers must be within 100m',
        count: 1
    },
    {
        id: 'curse_bench',
        type: 'Curse',
        title: 'Curse of the Waiting Bench',
        description: 'Seekers must sit on a bench for 5 mins.',
        cost: 'Discard 1 card',
        count: 1
    },
    {
        id: 'curse_number',
        type: 'Curse',
        title: 'Curse of the Hidden Number',
        description: 'Seekers must find mailbox with number 7. Fail 5m -> Stop 10m.',
        cost: 'Discard 1 card',
        count: 1
    },
    {
        id: 'curse_white',
        type: 'Curse',
        title: 'Curse of the White Vehicle',
        description: 'Seekers go opposite direction until they see a white Mazda.',
        cost: 'Discard 2 cards',
        count: 1
    },
    {
        id: 'curse_red_light',
        type: 'Curse',
        title: 'Curse of the Red Light',
        description: 'Seekers must stop for 2 minutes at the next intersection.',
        cost: 'Discard 1 card',
        count: 1
    },

    // 5 Discard 2 Draw 3
    {
        id: 'action_greed',
        type: 'Action',
        title: 'Greed',
        description: 'Discard 2 cards to Draw 3 cards.',
        cost: 'Discard 2 cards',
        count: 5
    },

    // 10 Discard 1 Draw 2
    {
        id: 'action_barter',
        type: 'Action',
        title: 'Barter',
        description: 'Discard 1 card to Draw 2 cards.',
        cost: 'Discard 1 card',
        count: 10
    },

    // 10 5 Min Bonus
    {
        id: 'bonus_5',
        type: 'Time Bonus',
        title: '5 Minute Bonus',
        description: 'Extends hidden time by 5 minutes.',
        cost: 'Free',
        count: 10
    },

    // 6 10 Min Bonus
    {
        id: 'bonus_10',
        type: 'Time Bonus',
        title: '10 Minute Bonus',
        description: 'Extends hidden time by 10 minutes.',
        cost: 'Free',
        count: 6
    },

    // 3 15 Min Bonus
    {
        id: 'bonus_15',
        type: 'Time Bonus',
        title: '15 Minute Bonus',
        description: 'Extends hidden time by 15 minutes.',
        cost: 'Free',
        count: 3
    },

    // 1 15 Move Card
    {
        id: 'action_move',
        type: 'Action',
        title: '15 Minute Move',
        description: 'Relocate to a new spot (15 mins pause).',
        cost: 'Free',
        count: 1
    }
];
