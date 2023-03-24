let cards:Array<string> = ["1|red", "1|red", "1|red", "2|red", "2|red", "3|red",
"3|red", "4|red", "4|red", "5|red", "1|blue", "1|blue", "1|blue", "2|blue",
 "2|blue", "3|blue", "3|blue", "4|blue", "4|blue", "5|blue", "1|yellow", "1|yellow",
 "1|yellow", "2|yellow", "2|yellow", "3|yellow", "3|yellow", "4|yellow", "4|yellow",
 "5|yellow", "1|green", "1|green", "1|green", "2|green", "2|green", "3|green", "3|green",
 "4|green",  "4|green", "5|green", "1|white", "1|white", "1|white", "2|white", "2|white", 
 "3|white", "3|white", "4|white", "4|white", "5|white"]

let playedCards:Array<string> = [];

let discardedDeck: Array<string> = [];
let decks = {"blue": [], "red": [], "yellow": [], "white": [],
            "green": []}
let aiHints: Array<number> = [];
let userHints: Array<number> = [];

function getRandomCard(cards: Array<string>, playedCards: Array<string>){
    cards = cards.filter( ( el ) => !playedCards.includes( el ) );
    let randomCard = cards[Math.floor(Math.random()*cards.length)];
    playedCards.push(randomCard);
    return [randomCard, playedCards];
};

function generateDeck(cards: Array<string>, playedCards: Array<string>){
    let deck:Array<string> = [];
    for (let i =0; i < 5; i++){
        let output = getRandomCard(cards, playedCards);
        deck.push(output[0]);
        playedCards = output[1];
    };
    return [deck, playedCards];
};

function safeToPlay(deck:Array<number>, card:number){
    if (((deck.length == 0) & (card==1))|(deck[-1]+1 == card)){
        return true;
    }
    else {
        return false;
    }
}

function play(cards:Array<string>, cardsToPlay:Array<string>, hints:Array<string>, 
playedCards:Array<string>, decks){
    let idx = 0;
    let toPlay = cardsToPlay[hints[idx]];
    let card = toPlay.split("|");
    let nmbr = card[0];
    let color = card[1];
    let safePlay = safeToPlay(decks[color], nmbr);

    while ((safePlay == false) && (idx < hints.length - 1)){
        idx++;
        console.log(idx);
        toPlay = cardsToPlay[hints[idx]];
        card = toPlay.split("|");
        nmbr = card[0];
        color = card[1];
        safePlay = safeToPlay(decks[color], nmbr);
    }

    if (safePlay == true){
        // add a card to deck
        decks[color] = decks[color].push(nmbr);
        // delete used cards
        cardsToPlay.splice(hints[idx], 1);
        hints.splice(idx, 1);
        let output = getRandomCard(cards, playedCards);
        cardsToPlay.push(output[0]);
        return [cardsToPlay, hints, decks];
    }
    else {
        return false
    }
}

function discard(cards: Array<string>, cardsToPlay:Array<string>, 
playedCards: Array<string>, discardedDeck:Array<string>, hints:Array<number>){
    let idx = 0;
    while ((idx in hints) && (idx < hints.length - 1)){
        idx++;
    }
    if (idx == hints.length){
        idx = 0;
    }
    discardedDeck.push(cardsToPlay[idx]);
    cardsToPlay.splice(idx, 1);
    let output = getRandomCard(cards, playedCards);
    cardsToPlay.push(output[0]);
    return [cardsToPlay, output[1], discardedDeck];
}

function giveHint(discardedDeck: Array<string>, decks, cards, hints){
    // cards without hints
    if ((cards[0] in discardedDeck)|(cards[0].startsWith("5"))){
        hints.push(0)
        return hints
    }
    else {
        let card = "";
        let safePlay = false;
        for (let idx in cards){
            card = cards[idx].split("|")
            safePlay = safeToPlay(decks[card[1]], card[0])
            if (safePlay == true){
                hints.push(idx)
                break;
            }
        }
        if (safePlay == false){
            return false;
        }
        else {
            return hints;
        }
    }
    
    //console.log(hints)
    //console.log(discardedDeck, decks, cards, hints);
}

function makeDecision(aiCards, userCards, aiHints, userHints, decks, discardedDeck, cards, playedCards){
    let toGiveHint = giveHint(discardedDeck, decks, userCards, userHints);
    if (toGiveHint === false){
        if (aiHints.length != 0){
            let toPlay = play(cards, aiCards, aiHints, playedCards, decks);
            if (toPlay == false){
                let toDiscard = discard(cards, aiCards, playedCards, discardedDeck, aiHints);
                aiCards = toDiscard[0];
                playedCards = toDiscard[1];
                discardedDeck = toDiscard[2];
            }
            else {
                    aiCards = toPlay[0];
                    aiHints = toPlay[1];
                    decks = toPlay[2];
            }
        }
        else {
            let toDiscard = discard(cards, aiCards, playedCards, discardedDeck, aiHints);
            aiCards = toDiscard[0];
            playedCards = toDiscard[1];
            discardedDeck = toDiscard[2];
        }
    }
    else {
        userHints = toGiveHint;
    }
    return [aiCards, decks, discardedDeck, userHints, aiHints, playedCards]
    };


function check_score(decks, discardedDeck){
    for (let deck in decks){
        if (decks[deck].length == 0){
            let card:string = "1|" + deck;
            if (discardedDeck.filter(x => x===card).length == 3){
                return false;
            };
        }
        else {
            let cardDeck = decks[deck];
            let nextCard = cardDeck[cardDeck.length -1] + 1;
            let card:string = nextCard + "|" + deck;
            if (nextCard == 5){
                if (discardedDeck.filter(x => x===card).length == 1){
                    return false;
            }}
            else {
                if (discardedDeck.filter(x => x===card).length == 2){
                    return false;
            }}
        }
    }
    return true;
};

let output = generateDeck(cards, playedCards);
let userCards = output[0];
playedCards = output[1];

output = generateDeck(cards, playedCards);
let aiCards = output[0];
playedCards = output[1];

let round = makeDecision(aiCards, userCards, aiHints, userHints, decks, discardedDeck, cards, playedCards);

aiCards = round[0];
decks = round[1];
discardedDeck = round[2];
userHints = round[3];
aiHints = round[4];
playedCards = round[5];

decks["white"] = [1, 2]

console.log(check_score(decks, discardedDeck));