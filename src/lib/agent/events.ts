// Wire protocol from the Python agent (agent/main.py) to the chat window: one JSON object per line.
export type Pick = { id: string; reason: string };

export type NoraEvent =
  | { t: "turn" } // a new model step begins; following text starts a new paragraph
  | { t: "text"; d: string }
  | { t: "products"; picks: Pick[] }
  | { t: "cart"; op: "add"; id: string; qty: number }
  | { t: "cart"; op: "set"; id: string; qty: number }
  | { t: "cart"; op: "remove"; id: string }
  | { t: "chips"; items: string[] }
  | { t: "sms"; text: string } // a text to the simulated phone
  | { t: "checkout"; day?: string | null; window?: string | null; address?: string | null; pay?: boolean }
  | { t: "done"; messages: unknown[] } // this turn's messages, appended verbatim to the transcript
  | { t: "error"; message: string };
