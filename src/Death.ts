import { Database } from "./Database";

let stopwatch = require("timer-stopwatch");

export class Death {
    private bettingTime: number = 120 * 1000;
    private bettingTimer: any;
    private isBetting: boolean = false;
    private userBets: { [index: string] : { [index: string]: any }} = null;
    private userChoices: { [index: string]: Array<string> } = null;
    private gameName: string;
    private currencyTemplate: string;

    constructor(private api: any, private helper: any, private log: any, private pubsub: any, private db: Database) {
        this.bettingTime = this.db.config().defaultBettingTime * 1000;
        this.gameName = this.db.config().defaultActiveGame;
        this.currencyTemplate = this.sendPub("currency.format", null, -1);

        this.log.info("Death bets are open for business.");
    }

    public execute(command: any, parameters: Array<string>, message: any): void {
        if (!parameters) {
            return;
        }

        if (parameters[0].toLowerCase() === "open" || parameters[0].toLowerCase() === "openbets") {
            this.openBets(message);
        } else if (parameters[0].toLowerCase() === "bet") {
            this.placeBet(parameters, message);
        } else if (parameters[0].toLowerCase() === "payout") {
            this.payout(parameters, message);
        }
    }

    private payout(parameters: Array<string>, message: any): void {
        if (!this.allowed(message.userRole)) {
            this.log.warn(`${message.username} attempted to start a betting cycle.`);
            return;
        }

        if (this.isBetting) {
            this.api.say("We can not payout during betting phase.");
            return;
        }

        if (parameters.length < 2) {
            this.api.say(`${message.username} you must include a payout choice as well.`);
            return;
        }

        let choice = parameters[1].toLowerCase();
        let choices: Array<string> = this.db.bets(this.gameName);

        if (choices.indexOf(choice) < 0) {
            this.api.say(`${message.username} you must include a valid choice for the payout. ${choice} is not valid.`);
            return;
        }

        let totalPlayers = 0;
        let perPlayerPercent = 0.0; 

        Object.keys(this.userChoices).forEach((key) => {
            totalPlayers += this.userChoices[key].length;
        });


        perPlayerPercent = this.db.config().maxPercent / totalPlayers;

        let payoutPercent = this.db.config().maxPercent - (perPlayerPercent * this.userChoices[choice].length);

        this.userChoices[choice].forEach((user) => {
            let reward = Math.ceil((this.userBets[user].bet / 100) * (100 + payoutPercent));
            this.sendPub("incrementBalance", user, reward);

            this.api.say(`Everyone who chose ${choice} has won ${payoutPercent}% more than their original bet!`);
            return;
        });
    }

    private placeBet(parameters: Array<string>, message: any): void {
        if (!this.isBetting) {
            this.api.say(`${message.username}, there is no betting cycle open yet.`);
            return;
        }

        if (parameters.length < 3) {
            this.api.say(`${message.username} you must include a bet and choice. Ex: !death bet 10 mybet`);
            return;
        }

        if (this.userBets[message.userId] !== undefined) {
            this.api.say(`${message.username}, you've already placed a bet!`);
            return;
        }

        let bet = Number(parameters[1]);
        let choice = parameters[2].toLowerCase();

        if (bet < 1) {
            this.api.say(`${message.username}, you must bet more than 0.`);
            return;
        }

        if (this.db.bets(this.gameName).indexOf(choice) < 0) {
            this.api.say(`${message.username} you must include a valid choice for your bet. ${choice} is not valid.`);
            return;
        }

        if (!this.sendPub("hasBalance", message.userId, bet)) {
            this.api.say(`${message.username} you do not have enough to bet that amount.`);
            return;
        }

        this.userBets[message.userId] = { "bet": bet, "choice": choice };
        
        if (this.userChoices[choice] !== undefined) {
            this.userChoices[choice].push(message.userId);
        } else {
            this.userChoices[choice] = [message.userId];
        }

        this.sendPub("decrementBalance", message.userId, bet);

        this.api.say(`${message.username} has placed a ${this.currencyTemplate.replace("-1", this.helper.withCommas(bet))} bet for ${choice}.`);
    }

    private openBets(message: any): void {
        if (!this.allowed(message.userRole)) {
            this.log.warn(`${message.username} attempted to start a betting cycle.`);
            return;
        }   

        if (this.isBetting) {
            this.api.say("Betting is already open!");
            return;
        }

        this.api.say("Betting is now open. Place your bets now!");
        this.api.say(`Betting Choices: ${this.db.bets(this.gameName).toString()}`);

        this.isBetting = true;
        this.userBets = {};
        this.userChoices = {};
        this.bettingTimer = new stopwatch(this.bettingTime);

        this.bettingTimer.start();

        this.bettingTimer.on("almostdone", () => {
            this.api.say("10 seconds left in the betting cycle! Get them in NOW!");
        });

        this.bettingTimer.on("done", () => {
            this.isBetting = false;
            this.api.say("Betting cycle has been closed.");
        });
    }

    private allowed(role: string): boolean {
        return (role.toLowerCase() === "owner" || role.toLowerCase() === "moderator");
    }

    private sendPub(topic: string, userId: string, amount: number, data?: object) {
        return this.pubsub.publish(`economy.${topic}`, {
            userId: userId,
            amount: amount
        });
    }
}