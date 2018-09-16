import { Death } from "./Death";
import { Database } from "./Database";

export var commands: Array<string> = ["death"];

let api: any;
let helper: any;
let log;
let pubsub: any;
let death: Death;
let database: Database;

export function constructor(api: any, helper: any, log: any, pubsub: any) {
    this.api = api;
    this.helper = helper;
    this.log = log;
    this.pubsub = pubsub;
    this.database = new Database(this.log);
    this.death = new Death(this.api, this.helper, this.log, this.pubsub, this.database);
}