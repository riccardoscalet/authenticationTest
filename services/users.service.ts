export class UsersService {

    constructor(private db: LevelUp) {}

    get(username: string, callback: (err: any, value: any) => void): void {
        this.db.get(username, function(err, value) {
            callback(err, value);
        });
    }

    add(user: User, callback: (err: any) => void): void {
        this.db.put(user.username, user, function(err) {
            callback(err);
        });
    }

    getAll(callback: (err: any[], data ? : string[]) => void): void {
        let errors = [];
        let returnData = [];
        this.db.createKeyStream()
            .on('error', function(err) {
                console.log(`ERROR - UsersService.getAll - ${err}`);
                errors.push(err);
            }).on('data', function(data) {
                returnData.push(data);
            }).on('end', function() {
                callback(errors, returnData);
            });
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