import {
    User
} from "../model/user";

export class UsersService {

    constructor(private db: LevelUp) {
    }

    get(username: string, callback: Function): void {
        this.db.get(username, function (err, value) {
            callback(err, value);
        });
    }

    add(user: User, callback: Function): void {
        this.db.put(user.username, user.password, function (err) {
            callback(err);
        });
    }

    getAll(callback: Function): void {
        let returnData = [];
        this.db.createKeyStream()
            .on('error', function (err) {
                callback(err);
            }).on('data', function (data) {
                returnData.push(data);
            }).on('end', function () {
                callback(null, returnData);
            })
    }

}