export class UsersService {

    constructor(private db: LevelUp) {}

    get(username: string,
        callback: (err: string, value: any) => void): void {

        this.db.get(username, function(err, value) {
            callback(err, value);
        });
    }

    add(user: User,
        callback: (err: string) => void): void {

        this.db.put(user.username, user, function(err) {
            callback(err);
        });
    }

    getAll(callback: (err: string, data ? : string[]) => void): void {

        let returnData = [];
        this.db.createKeyStream()
            .on('error', function(err) {
                callback(err);
            }).on('data', function(data) {
                returnData.push(data);
            }).on('end', function() {
                callback(null, returnData);
            })
    }

}

export class User {
    username: string;
    password: string;
    scope: string[];

    constructor(username: string, password: string, scope: string[]) {
        this.username = username;
        this.password = password;
        this.scope = scope;
    }
}