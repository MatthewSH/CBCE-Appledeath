import * as lowdb from "lowdb";
import * as FileSync from "lowdb/adapters/FileSync";

export class Database {
    private db: lowdb.LowdbSync<any>;

    public constructor(private log: any) {
        this.db = lowdb(new FileSync("appledeath.json"));

        this.db.defaultsDeep({
            config: {
                maxPercent: 300,
                minPercentReturn: 10,
                raiseStakePercent: 100,
                defaultBettingTime: 120,
                activeGame: "game1"
            },
            games: ["game1"],
            bets: {
                game1: ["bet1", "bet2", "bet3"]
            }
        }).write();
    }

    public database(): lowdb.LowdbSync<any> {
        return this.db;
    }

    public config(): any {
        return this.db.get("config").value();
    }

    public bets(game: string): any {
        return this.db.get(`bets.${game}`).value();
    }

    public games(): any {
        return this.db.get("games").value();
    }
}