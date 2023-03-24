/*
  
S> Which kind of joke do you want to hear?
U> programming
S> Ok, progamming. Here you go!
S> Debugging is like being the detective in a crime movie where you're also the murderer at the same time.
U> HAHAHA
S> What's funny?
U> ....
S> I see!

S> Which kind of joke do you want to hear?
U> blabla
S> I don't know any jokes of this kind. What kind of joke do you want to hear?

*/

import { MachineConfig, send, Action, assign } from "xstate";

interface Grammar {
  [index: string]: {
    intent: string;
    entities: {
      [index: string]: string;
    };
  };
}

const grammar: Grammar = {
  programming: { intent: "None", entities: { topic: "programming" } },
  pun: { intent: "None", entities: { topic: "pun" } },
  "word play": { intent: "None", entities: { topic: "pun" } },
};

const getEntity = (context: SDSContext, entity: string) => {
  // lowercase the utterance and remove tailing "."
  let u = context.recResult[0].utterance.toLowerCase().replace(/\.$/g, "");
  if (u in grammar) {
    if (entity in grammar[u].entities) {
      return grammar[u].entities[entity];
    }
  }
  return false;
};

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
      initial: "prompt", // default state
      on: {
        RECOGNISED: [
          {
            target: "tellJoke",
            cond: (context) => {
              return !!getEntity(context, "topic");
            },
            actions: assign({
              topic: (context) => getEntity(context, "topic")!,
            }),
          },
          { target: ".nomatch" },
        ],
      },
      states: {
        // all states inside "welcome"
        prompt: {
          // state "#root.dm.welcome.prompt"
          entry: send({
            // entry actions, send SPEAK event
            type: "SPEAK",
            value: "Which kind of joke do you want to hear?",
          }),
          on: {
            // transitions
            ENDSPEECH: "ask", // transition on the ENDSPEECH event to state "ask"
          },
        },
        ask: {
          entry: send("LISTEN"),
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "I don't know any jokes of this kind.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },
    tellJoke: {
      initial: "ground",
      states: {
        ground: {
          entry: send((context) => ({
            type: "SPEAK",
            value: `Ok, ${context.topic}.`,
          })),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          entry: send({
            type: "SPEAK",
            value:
              "Here you go! Debugging is like being the detective in a crime movie where you're also the murderer at the same time.",
          }),
        },
      },
    },
  },
};
