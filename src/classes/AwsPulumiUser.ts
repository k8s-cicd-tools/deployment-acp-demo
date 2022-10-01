import * as aws from "@pulumi/aws";


export class AwsPulumiUser {
    name: string;
    group_object: any;
    groupPolicy: any;
    user_object: any;
    userGroupMembership: any;
    accessKey: any;
    dependsOn: any[];

    constructor(name: string, dependsOn?: any[]) {
        this.name = name;
        this.dependsOn = dependsOn || [];
        this.create();
    }

    create() {
        this.group_object = new aws.iam.Group(`User group ${this.name}`, {
            name: this.name
        }, {dependsOn: this.dependsOn});

        this.groupPolicy = new aws.iam.GroupPolicy(`User group policy ${this.name}`, {
            name: `${this.name}-policy`,
            group: this.group_object.name,
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: [
                            "s3:*",
                        ],
                        Effect: "Allow",
                        Resource: "*",
                    }
                ],
            },
        }, {dependsOn: [this.group_object]});

        this.user_object = new aws.iam.User(`User ${this.name}`, {
            name: this.name,
        }, {dependsOn: [this.groupPolicy]});

        this.userGroupMembership = new aws.iam.UserGroupMembership(`User group membership ${this.name}`, {
            user: this.user_object.name,
            groups: [this.group_object.name],
        }, {dependsOn: [this.user_object]});

        this.accessKey = new aws.iam.AccessKey(`User access key ${this.name}`, {
            user: this.user_object.name,
        }, {dependsOn: [this.userGroupMembership]});

    }

    getDependsOn() {
        return [this.accessKey];
    }
}