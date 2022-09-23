import * as aws from "@pulumi/aws";


export class AwsS3 {
    bucketName: string;
    bucket_object: any;
    provider: aws.Provider;
    dependsOn: any[];

    constructor(bucketName: string, provider: aws.Provider, dependsOn: any[]) {
        this.bucketName = bucketName;
        this.provider = provider;
        this.dependsOn = dependsOn;
        this.create();
    }

    create() {
        this.bucket_object = new aws.s3.Bucket(`bucket creation ${this.bucketName}`, {
            bucket: this.bucketName,
            acl: "private",
            forceDestroy: true,
            versioning: {
                enabled: true,
            }
        }, {dependsOn: this.dependsOn, provider: this.provider});
    }

    getDependsOn() {
        return [this.bucket_object];
    }
}