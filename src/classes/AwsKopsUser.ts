import * as aws from "@pulumi/aws";


export class AwsKopsUser {
    name: string;
    group_object: any;
    groupPolicy: any;
    user_object: any;
    userGroupMembership: any;
    accessKey: any;
    provider: aws.Provider;
    dependsOn: any[];

    constructor(name: string, provider?: aws.Provider, dependsOn?: any[]) {
        this.name = name;
        this.provider = provider || new aws.Provider("default", {});
        this.dependsOn = dependsOn || [];
        this.create();
    }

    create() {
        this.group_object = new aws.iam.Group(`User group ${this.name}`, {
            name: this.name
        }, {provider: this.provider, dependsOn: this.dependsOn});

        this.groupPolicy = new aws.iam.GroupPolicy(`User group policy ${this.name}`, {
            name: `${this.name}-policy`,
            group: this.group_object.name,
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: [
                            "ec2:*",
                            "route53:*",
                            "s3:*",
                            "iam:*",
                            "sqs:*",
                            "events:*",
                            "autoscaling:*",
                            "elasticloadbalancing:*",
                        ],
                        Effect: "Allow",
                        Resource: "*",
                    }
                ],
            },
        }, {dependsOn: [this.group_object], provider: this.provider});

        this.user_object = new aws.iam.User(`User ${this.name}`, {
            name: this.name,
        }, {dependsOn: [this.groupPolicy], provider: this.provider});

        this.userGroupMembership = new aws.iam.UserGroupMembership(`User group membership ${this.name}`, {
            user: this.user_object.name,
            groups: [this.group_object.name],
        }, {dependsOn: [this.user_object], provider: this.provider});

        this.accessKey = new aws.iam.AccessKey(`User access key ${this.name}`, {
            user: this.user_object.name,
        }, {dependsOn: [this.userGroupMembership], provider: this.provider});

    }

    getDependsOn() {
        return [this.accessKey];
    }
}