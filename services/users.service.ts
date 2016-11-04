import * as hash from "object-hash";

/**
 * Service that manages all operations regarding users, including interactions with database.
 * 
 * @export
 * @class UsersService
 */
export class UsersService {

    constructor(private db: LevelUp) {}


    /**
     * Finds a user on database.
     * 
     * @param {string} username
     * @param {(err: any, value: any) => void} callback
     * 
     * @memberOf UsersService
     */
    get(username: string, callback: (err: any, value: any) => void): void {
        this.db.get(username, function(err, value) {
            callback(err, value);
        });
    }

    /**
     * Adds or overwrites a user on database.
     * 
     * @param {User} user
     * @param {(err: any) => void} callback
     * 
     * @memberOf UsersService
     */
    add(user: User, callback: (err: any) => void): void {
        // Hashes password 
        user.password = hash.sha1(user.password);

        // Writes user on db
        this.db.put(user.username, user, function(err) {
            callback(err);
        });
    }

    /**
     * Gets all usernames from database.
     * 
     * @param {(err: any[], data ? : string[]) => void} callback
     * 
     * @memberOf UsersService
     */
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

    /**
     * Attempts to validate user crendentials, after searching the user on db.
     * 
     * @param {string} username
     * @param {string} password
     * @param {(err: number, isValid: boolean, user ? : User) => void} callback
     * 
     * @memberOf UsersService
     */
    validateCredentials(
        username: string,
        password: string,
        callback: (err: number, isValid: boolean, user ? : User) => void): void {

        this.get(username, function(err, user: User) {
            if (err) {
                if (err.notFound) return callback(-2, false);
                else return callback(-1, false);
            }

            let hashedPassword = hash.sha1(password);

            if (user.password == hashedPassword) return callback(null, true, user);
            else return callback(-3, false);
        });
    }
}

export class User {
    username: string;
    password: string;
    email: string;
    scope: string[];

    constructor(username: string, password: string, email: string, scope: string[]) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.scope = scope;
    }
}