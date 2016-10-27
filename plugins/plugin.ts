export interface IRegister {
    (server: any, options: any, next: any): void;
    attributes ? : any;
}

export abstract class Plugin {
    constructor(options: any, attributes: any) {
        this.register.attributes = attributes;
    }

    register: IRegister = (server, options, next) => {
        server.bind(this);
        this._register(server, options);
        next();
    };

    abstract _register(server, options);
}