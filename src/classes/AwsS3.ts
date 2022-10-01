import * as aws from "@pulumi/aws";


export class AwsS3 {
    bucketName: string;
    bucket_object: any;
    dependsOn: any[];

    constructor(bucketName: string, dependsOn?: any[]) {
        this.bucketName = bucketName;
        this.dependsOn = dependsOn || [];
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
        }, {dependsOn: this.dependsOn});
    }

    getDependsOn() {
        return [this.bucket_object];
    }

}

