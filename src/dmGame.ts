import { MachineConfig, send, Action, assign, actions } from "xstate";
const { choose, log } = actions;

function say(text: string): Action<SDSContext, SDSEvent> {
  return send((_context: SDSContext) => ({ type: "SPEAK", value: text }));
}

interface Grammar {
  [index: string]: {
    intent: string;
    entities: {
      [index: string]: string;
    };
  };
}

const grammar: Grammar = {
  "first to the right": {
    intent: "None",
    entities: { title: 4},
  },
  "1st to the right": {
    intent: "None",
    entities: { title: 4 },
  },
  "first to the left": {
    intent: "None",
    entities: { title: 0 },
  },
  "1st to the left": {
    intent: "None",
    entities: { title: 0 },
  },
    "second to the right": {
    intent: "None",
    entities: { title: 3},
  },
  "second to the left": {
    intent: "None",
    entities: { title: 1 },
  },
    "third to the left": {
    intent: "None",
    entities: { title: 2 },
  },
  "third to the right": {
    intent: "None",
    entities: { title: 2 },
  },
  "3rd to the left": {
    intent: "None",
    entities: { title: 2 },
  },
  "3rd to the right": {
    intent: "None",
    entities: { title: 2 },
  },
    "fourth to the right": {
    intent: "None",
    entities: { title: 1},
  },
  "fourth to the left": {
    intent: "None",
    entities: { title: 3 },
  },
   "4th to the right": {
    intent: "None",
    entities: { title: 1},
  },
  "4th to the left": {
    intent: "None",
    entities: { title: 3 },
  },
  "fifth to the right": {
    intent: "None",
    entities: { title: 0},
  },
  "fifth to the left": {
    intent: "None",
    entities: { title: 4 },
  },
  "5th to the right": {
    intent: "None",
    entities: { title: 0},
  },
  "5th to the left": {
    intent: "None",
    entities: { title: 4 },
  },

};

const getEntity = (context: SDSContext, title) => {
  // lowercase the utterance and remove tailing "."
  let u = context.recResult[0].utterance.toLowerCase().replace(/\.$/g, "");
  if (u in grammar) {
    return grammar[u].entities["title"];
  }
  return false;
};

let threshold = 0;
let nlu_threshold = 0;

let playedCards:Array<string> = [];

let decks = {"blue": [], "red": [], "yellow": [], "white": [],
            "green": []};
			

			

let cards:Array<string> = ["1|red", "1|red", "1|red", "2|red", "2|red", "3|red",
"3|red", "4|red", "4|red", "5|red", "1|blue", "1|blue", "1|blue", "2|blue",
 "2|blue", "3|blue", "3|blue", "4|blue", "4|blue", "5|blue", "1|yellow", "1|yellow",
 "1|yellow", "2|yellow", "2|yellow", "3|yellow", "3|yellow", "4|yellow", "4|yellow",
 "5|yellow", "1|green", "1|green", "1|green", "2|green", "2|green", "3|green", "3|green",
 "4|green",  "4|green", "5|green", "1|white", "1|white", "1|white", "2|white", "2|white", 
 "3|white", "3|white", "4|white", "4|white", "5|white"];


const check_repetitions = (repetion) => {
	if (repetion === undefined){
		repetion = 1}
	else {repetion += 1}
	return repetion
};

const getIntent = (context: SDSContext) => {
  // lowercase the utterance and remove tailing "."
  //let u = context.recResult[0].utterance.toLowerCase().replace(/\.$/g, "");
  let u = context.nluResult.prediction.topIntent
  //if (u in grammar) {
  //  return grammar[u].intent;
  //}
  return u;
};


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
    if (((deck.length == 0) & (card==1))|(deck[deck.length-1] == String(card - 1))){
        return true;
    }
    else {
        return false;
    }
}

function play(cards:Array<string>, context){
    let idx = 0;
    let toPlay = context.aiCards[context.aiHints[idx]];
    let card = toPlay.split("|");
    let nmbr = card[0];
    let color = card[1];
    let safePlay = safeToPlay(context.decks[color], nmbr);

    while ((safePlay == false) && (idx < context.aiHints.length - 1)){
        idx++;
        toPlay = context.aiCards[context.aiHints[idx]];
        card = toPlay.split("|");
        nmbr = card[0];
        color = card[1];
        safePlay = safeToPlay(context.decks[color], nmbr);
    }

    if (safePlay == true){
        // add a card to deck
        context.decks[color].push(nmbr);
        // delete used cards
        context.aiCards.splice(context.aiHints[idx], 1);
        context.aiHints.splice(idx, 1);
        let output = getRandomCard(cards, context.playedCards);
        context.aiCards.push(output[0]);
        return [context.aiCards, context.aiHints, context.decks];
    }
    else {
        return false
    }
}

function userPlay(context, position){
	let cards:Array<string> = ["1|red", "1|red", "1|red", "2|red", "2|red", "3|red",
	"3|red", "4|red", "4|red", "5|red", "1|blue", "1|blue", "1|blue", "2|blue",
	 "2|blue", "3|blue", "3|blue", "4|blue", "4|blue", "5|blue", "1|yellow", "1|yellow",
	 "1|yellow", "2|yellow", "2|yellow", "3|yellow", "3|yellow", "4|yellow", "4|yellow",
	 "5|yellow", "1|green", "1|green", "1|green", "2|green", "2|green", "3|green", "3|green",
	 "4|green",  "4|green", "5|green", "1|white", "1|white", "1|white", "2|white", "2|white", 
	 "3|white", "3|white", "4|white", "4|white", "5|white"];
	let toPlay = context.userCards[position];
    let card = toPlay.split("|");
    let nmbr = card[0];
    let color = card[1];
	if (safeToPlay(decks[color], nmbr) == true){
		decks[color].push(nmbr);
		// delete used cards
		context.userCards.splice(position, 1);
		if (position in context.userHints){
			context.userHints.splice(position, 1)};
		let output = getRandomCard(cards, context.playedCards);
		context.userCards.push(output[0]);
			return [context.userCards, context.userHints, context.decks];
		}
	else 
		{return false}
	};
	
	
function checkUserPlay(context, position){
	let toPlay = context.userCards[position];
    let card = toPlay.split("|");
    let nmbr = card[0];
    let color = card[1];
	if (safeToPlay(decks[color], nmbr) == true){
			return true;
		}
	else 
		{return false}
	};

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
};

function checkUserDiscard(context, position){
	let card = context.userCards[position];
	if (card in context.discardedDeck){
		num = card[0];
		if (num == "1"){
			if (context.discardedDeck.filter(x => x===card).length == 2){
				return false}
			else {return true}
        }
        else {
            if (context.discardedDeck.filter(x => x===card).length == 1){
				return false}
			else {return true}
        }
    }
	else
		{return true}
};

function userDiscard(context, position:number){
	let discardedDeck = context.discardedDeck
	let userCards = context.usedCards
	let playedCards = context.playedCards
    context.discardedDeck.push(context.userCards[position]);
    context.userCards.splice(position, 1);
	
    let output = getRandomCard(cards, context.playedCards)
	
    context.userCards.push(output[0]);
	context.playedCards = output[1];
	return [context.discardedDeck, context.userCards, context.playedCards];
	};

function giveHint(discardedDeck: Array<string>, decks, cards, hints){
    // cards without hints
    if ((cards[0] in discardedDeck)|(cards[0].startsWith("5"))){
        hints.push(0)
        return [hints, 0]
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
            return [hints, hints[hints.length -1]];
        }
    }
    
}

function makeDecision(context){
	let cards:Array<string> = ["1|red", "1|red", "1|red", "2|red", "2|red", "3|red",
	"3|red", "4|red", "4|red", "5|red", "1|blue", "1|blue", "1|blue", "2|blue",
	 "2|blue", "3|blue", "3|blue", "4|blue", "4|blue", "5|blue", "1|yellow", "1|yellow",
	 "1|yellow", "2|yellow", "2|yellow", "3|yellow", "3|yellow", "4|yellow", "4|yellow",
	 "5|yellow", "1|green", "1|green", "1|green", "2|green", "2|green", "3|green", "3|green",
	 "4|green",  "4|green", "5|green", "1|white", "1|white", "1|white", "2|white", "2|white", 
	 "3|white", "3|white", "4|white", "4|white", "5|white"];
	
	let idx2position = ["first to the left", "second to the left", "third to the left",
	"fourth to the left", "fifth to the left",]
	
	let move = "";
    let toGiveHint = giveHint(context.discardedDeck, context.decks, context.userCards, context.userHints);
    if (toGiveHint === false){
        if (context.aiHints.length != 0){
            let toPlay = play(cards, context);
            if (toPlay == false){
                let toDiscard = discard(cards, context.aiCards, context.playedCards, 
								context.discardedDeck, context.aiHints);
                context.aiCards = toDiscard[0];
                context.playedCards = toDiscard[1];
                context.discardedDeck = toDiscard[2];
				move = "I am discarding cards";
            }
            else {
                    context.aiCards = toPlay[0];
                    context.aiHints = toPlay[1];
                    context.decks = toPlay[2];
					move = "I am playing";
            }
        }
        else {
            let toDiscard = discard(cards, context.aiCards, context.playedCards, context.discardedDeck, context.aiHints);
            context.aiCards = toDiscard[0];
            context.playedCards = toDiscard[1];
            context.discardedDeck = toDiscard[2];
			move = "I am discarding cards";
        }
    }
    else {
        output = toGiveHint;
		context.userHints = output[0];
		position = idx2position[output[1]];
		move = "I will give a hint about card which is " + position;
    }
	if (check_score(context.decks, context.discardedDeck) == true){
		return [context.aiCards, context.decks, context.discardedDeck, context.userHints, context.aiHints, context.playedCards, move];
	}
	else {
		return false;
		};
    };
	
function repeatHints(hints){
	let idx2position = ["first to the left", "second to the left", "third to the left",
	"fourth to the left", "fifth to the left",]
	let hint_str = "";
	if (hints.length == 0){
		hint_str = "You don't have any hints";
	}
	else {
		hint_str = "Your hints are ";
		for (i in hints){
			hint_str = hint_str + idx2position[hints[i]];
		}};
	return hint_str};		


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

function get_score(decks){
    let score = decks["white"].length + decks["red"].length + decks["blue"].length + decks["yellow"].length + decks["green"].length;
    return score;
}

function generateHTMLCards(cards){
	let html_div = "<div class='hand hhand-compact active-hand center' style='margin: 0 auto'>"
	for (let i in cards){
			html_div = html_div + `<img class="card" src="cards/${cards[i].replace("|", "")}.png">`
		}
		
	html_div = html_div + "</div>";
	
	document.getElementById("ai_cards").innerHTML = html_div;
}

function generateOneDeck(decks, color){
	let deck = decks[color];
	let html_deck = '<div class="hand vhand-compact">';
	if (deck.length == 0){
		html_deck = html_deck + '<img class="card" src="">';}
	else {
		for (let i in deck){
			html_deck = html_deck + `<img class="card" src="cards/${deck[i]+color}.png">`
		}
	}
	html_deck = html_deck + "</div>";
	return html_deck;
}


function generateHTMLDecks(decks){
	document.getElementById("white").innerHTML = generateOneDeck(decks, "white");
	document.getElementById("yellow").innerHTML = generateOneDeck(decks, "yellow");
	document.getElementById("red").innerHTML = generateOneDeck(decks, "red");
	document.getElementById("blue").innerHTML = generateOneDeck(decks, "blue");
	document.getElementById("green").innerHTML = generateOneDeck(decks, "green");
}
	
	


let output = generateDeck(cards, playedCards);
let userCards = output[0];
playedCards = output[1];

output = generateDeck(cards, playedCards);
let aiCards = output[0];
playedCards = output[1];


generateHTMLCards(aiCards);
generateHTMLDecks(decks);



export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = {
  initial: "idle",
  states: {
    idle: {
      on: {
        CLICK: "init",
      },
    },
    init: {
      on: {
        TTS_READY: "welcome",
        CLICK: "welcome",
      },
    },
    welcome: {
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "greeting",
            actions: [assign({
              username: (context) => context.recResult[0].utterance,
            }),
			assign({
			  userHints: (context) => []}),
			assign({
			  aiHints: (context) => []}),
			assign({
			  discardedDeck: (context) => []}),
			assign({
			  aiCards: (context) => aiCards}),
			assign({
			  userCards: (context) => userCards}),
			assign({
			  decks: (context) => decks}),
			assign({
			  playedCards: (context) => playedCards}),
          ],},
        ],
        TIMEOUT: [{
			target: "init",
			cond: (context) => context.repetion == 3,
			actions: assign({
				repetion: (context) = 0}),
		},
		{
			target: ".prompt",
			actions: assign({repetion: (context) => check_repetitions(context.repetion)}),
	  },],},
      states: {
        prompt: {
          entry: say("Hello! What is your name?"),
          on: { ENDSPEECH: "ask" },
        },
        ask: {
          entry: send("LISTEN"),
        },
        },
      },
	greeting: {
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "tell_rules",
            cond: (context) => getIntent(context) === "confirm",},
		{
            target: "user_play",
            cond: (context) => getIntent(context) === "reject",},
			{
            target: ".nomatch",
          },
        ],
        TIMEOUT: [{
			target: "init",
			cond: (context) => context.repetion == 3,
			actions: assign({
				repetion: (context) = 0})
		},
		{
			target: ".prompt",
			actions: assign({repetion: (context) => check_repetitions(context.repetion)}),
	  },],
      },
      states: {
		prompt: {entry: send((context) => ({
			type: "SPEAK",
			value: `OK, ${context.username}. Let's play Hanabi? Do you want me to tell you rules?`,})),
          on: { ENDSPEECH: "ask" },}, 
		ask: {
          entry: send("LISTEN"),
			},
		nomatch: {
          entry: say(
            "Sorry, I don't understand. Can you repeat please?"
          ),
          on: { ENDSPEECH: "ask" },
        },
	  },
	  },
	  tell_rules: {
		initial: "prompt",
		on: {
			RECOGNISED: [
			{target: "user_play",
			cond: (context) => getIntent(context) == "confirm"},
			{target: ".prompt",
			cond: (context) => getIntent(context) == "reject"},
			{
            target: ".nomatch",
			},
			],
		TIMEOUT: [{
			target: "init",
			cond: (context) => context.repetion == 3,
			actions: assign({
				repetion: (context) = 0})
		},
		{
			target: ".prompt",
			actions: assign({repetion: (context) => check_repetitions(context.repetion)}),
	  },],
      },
	  states: {
		prompt: {entry: send((context) => ({
			type: "SPEAK",
			value:("In Hanabi, a user and a computer have a set of cards but they can only see cards of another player. The idea is to give hints which cards are important. In their turn a player can play a card, discard a card that is useless right now to get more useful cards or to give a hint to another player. Players should collect 5 decks of cards of different color from 1 to 5. All cards except for 5 have duplicates. That's all about rules. Are you ready to play?")})),
		on: {ENDSPEECH: "ask"}},
	  ask: {
          entry: send("LISTEN"),
			},
		nomatch: {
          entry: say(
            "Sorry, I don't understand. Can you repeat please?"
          ),
          on: { ENDSPEECH: "ask" },
	  },},
	  },
	  get_hint: {
		initial: "prompt",
		on: {
		RECOGNISED: [
		{
            target: "user_play",
            cond: (context) => getIntent(context) === "wrong_intent",
			actions: say("I am sorry")},
		  {
            target: "ai_play",
            cond: (context) => (getEntity(context, "position") !== false),
			actions: [(context) => context.aiHints.push(getEntity(context, "position")),]},
			{
            target: ".nomatch",
          },
        ],
        TIMEOUT: [{
			target: "init",
			cond: (context) => context.repetion == 3,
			actions: assign({
				repetion: (context) = 0})
		},
		{
			target: ".prompt",
			actions: assign({repetion: (context) => check_repetitions(context.repetion)}),
	  },],
	  },
	  states: {
		prompt: {entry: send((context) => ({
			type: "SPEAK",
			value: `Which card do you want to hint at?`,})),
			on: { ENDSPEECH: "ask" },},
		ask: {
          entry: send("LISTEN"),
			},
		nomatch: {
          entry: say(
            "Sorry, I don't understand. Can you repeat please?"
          ),
          on: { ENDSPEECH: "ask" },
        },
	  },},
	  play: {
		initial: "prompt",
		on: {
		RECOGNISED: [
		{
            target: "user_play",
            cond: (context) => getIntent(context) === "wrong_intent",
			actions: say("I am sorry")},
          {
            target: "ai_play",
            cond: (context) => ((getEntity(context, "position") !== false) && (checkUserPlay(context, getEntity(context, "position")) != false)),
			actions: [assign({
				position: (context) => getEntity(context, "position"),}),
				assign({
					output: (context) => userPlay(context, context.position)}),
				assign({
					userCards: (context) => context.output[0],}),
				assign({
					userHints: (context) => context.output[1],}),
				assign({
					decks: (context) => context.output[2],}),
				(context) => generateHTMLDecks(context.decks),
					],
			},
			{
            target: ".nomatch",
			cond: (context) => getEntity(context, "position") === false,
          },
		  	{
			target: "end_game",
			},
        ],
        TIMEOUT: [{
			target: "init",
			cond: (context) => context.repetion == 3,
			actions: assign({
				repetion: (context) = 0})
		},
		{
			target: ".prompt",
			actions: assign({repetion: (context) => check_repetitions(context.repetion)}),
	  },],},
	  states: {
		prompt: {entry: send((context) => ({
			type: "SPEAK",
			value: `What card do you want to play?`,})),
			on: { ENDSPEECH: "ask" },},
		ask: {
          entry: send("LISTEN"),
			},
		nomatch: {
          entry: say(
            "Sorry, I don't understand. Can you repeat please?"
          ),
          on: { ENDSPEECH: "ask" },
        },
	  },
	  },
	  discard: {
		initial: "prompt",
		on: {
		RECOGNISED: [
			{
            target: "user_play",
            cond: (context) => getIntent(context) === "wrong_intent",
			actions: say("I am sorry")},
          {
            target: "ai_play",
			cond: (context) => (getEntity(context, "position") !== false) && (checkUserDiscard(context, getEntity(context, "position")) != false),
			actions: [assign({
				position: (context) => getEntity(context, "position"),}),
				assign({
					output: (context) => userDiscard(context, context.position)}),
				assign({
					discardedDeck: (context) => context.output[0],}),
				assign({
					userCards: (context) => context.output[1],}),
				assign({
					playedCards: (context) => context.output[2],}),
					],
			},
			{
			target: ".nomatch",
			cond: (context) => (getEntity(context, "position")==false),
            
          },
		  { target: "end_game"
		  }
        ],
        TIMEOUT: [{
			target: "init",
			cond: (context) => context.repetion == 3,
			actions: assign({
				repetion: (context) = 0})
		},
		{
			target: ".prompt",
			actions: assign({repetion: (context) => check_repetitions(context.repetion)}),
	  },],
	  },
	  states: {
		prompt: {entry: send((context) => ({
			type: "SPEAK",
			value: `Which card do you want to discard?`,})),
			on: { ENDSPEECH: "ask" },},
		ask: {
          entry: send("LISTEN"),
			},
		nomatch: {
          entry: say(
            "Sorry, I don't understand. Can you repeat please?"
          ),
          on: { ENDSPEECH: "ask" },
        },
	  },
	  },
	  ai_play: {
		initial: "prompt",
		on: {
		RECOGNISED: [
          {
            target: "user_play",
			actions: [assign({
				output: (context) => makeDecision(context)}),
				// context.aiCards, context.decks, context.discardedDeck, context.userHints, context.aiHints, context.playedCards, move,
				send((context) => ({ type: "SPEAK", value: context.output[6] })),
				assign({
					aiCards: (context) => context.output[0],}),
				assign({
					decks: (context) => context.output[1],}),
				assign({
					discardedDeck: (context) => context.output[2],}),
				assign({
					userHints: (context) => context.output[3],}),
				assign({
					aiHints: (context) => context.output[4],}),
				assign({
					playedCards: (context) => context.output[5],}),
				(context) => generateHTMLCards(context.aiCards),
				(context) => generateHTMLDecks(context.decks),
					],},
        ],
        TIMEOUT: [{
			target: "init",
			cond: (context) => context.repetion == 3,
			actions: assign({
				repetion: (context) = 0})
		},
		{
			target: ".prompt",
			actions: assign({repetion: (context) => check_repetitions(context.repetion)}),
	  },],
	  },
	  states: {
		prompt: {entry: send((context) => ({
			type: "SPEAK",
			value: `It's my turn to play!`,})),
			on: { ENDSPEECH: "ask" },},
		ask: {
          entry: send("LISTEN"),
			},
	  },
	  },
	remind_hints: {
		initial: "prompt",
		on: {
			RECOGNISED: [
			{target: "user_play",
			cond: (context) => getIntent(context) == "reject"},
			{target: ".prompt",
			cond: (context) => getIntent(context) == "confirm"},
			{
            target: ".nomatch",
			},
			],
		TIMEOUT: [{
			target: "init",
			cond: (context) => context.repetion == 3,
			actions: assign({
				repetion: (context) = 0})
		},
		{
			target: ".prompt",
			actions: assign({repetion: (context) => check_repetitions(context.repetion)}),
	  },],
      },
	  states: {
		prompt: {entry: send((context) => ({
			type: "SPEAK",
			value:(`${repeatHints(context.userHints)}. Do you want me to repeat again?`)})),
		on: {ENDSPEECH: "ask"}},
	  ask: {
          entry: send("LISTEN"),
			},
		nomatch: {
          entry: say(
            "Sorry, I don't understand. Can you repeat please?"
          ),
          on: { ENDSPEECH: "ask" },
	  },},},
	user_play: {
      initial: "prompt",
      on: {
        RECOGNISED: [
		{
			target: "remind_hints",
            cond: (context) => getIntent(context) === "remind",
		},
		  {
			target: "tell_rules",
            cond: (context) => getIntent(context) === "learn_rules",
		},
          {
            target: "get_hint",
            cond: (context) => getIntent(context) === "give_hint",},
		{
            target: "discard",
            cond: (context) => getIntent(context) === "discard",},
		  {
            target: "play",
			cond: (context) => getIntent(context) === "play",
			},
			{
            target: ".nomatch",
          },
        ],
        TIMEOUT: [{
			target: "init",
			cond: (context) => context.repetion == 3,
			actions: assign({
				repetion: (context) = 0})
		},
		{
			target: ".prompt",
			actions: assign({repetion: (context) => check_repetitions(context.repetion)}),
	  },],
      },
      states: {
		prompt: {entry: send((context) => ({
			type: "SPEAK",
			value: "What do you want to do now?",})),
          on: { ENDSPEECH: "ask" },},
		ask: {
          entry: send("LISTEN"),
			},
		nomatch: {
          entry: say(
            "Sorry, I don't understand. Can you repeat please?"
          ),
          on: { ENDSPEECH: "ask" },
        },
	  },
	  },
	end_game: {
	  initial: "prompt",
	  states: {
		prompt: {entry: send((context) => ({
			type: "SPEAK",
			value: `The game is over. Your score is ${(get_score(context.decks))}`,})),},
	  },
	  },
	},
};
