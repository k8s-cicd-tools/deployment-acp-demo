

export class OpenPort {
    type: string;
    port: number;
    protocol: string;
    cidrBlocks: string[];

    constructor(type: string, port: number, protocol: string, cidrBlocks: string[]) {
        this.type = type;
        this.port = port;
        this.protocol = protocol;
        this.cidrBlocks = cidrBlocks;
    }

}