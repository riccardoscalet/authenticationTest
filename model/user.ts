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