import { AwsS3 } from "./AwsS3";
import { AwsKopsUser } from "./AwsKopsUser";
import { Cluster } from "./Cluster";
import * as pulumi from "@pulumi/pulumi";

export class Kops {
    name: string;
    kopsUser: any;
    kopsStateS3: any;
    region: any;
    kopsProvider: any;
    clusters: Cluster[] = [];
    environment: {} = {};
    dependsOn: any[];
    clusters_objects: any[] = [];

    constructor(name: string, region: string, clusters: Cluster[], dependsOn?: any[]) {
        this.name = name;
        this.region = region;
        this.dependsOn = dependsOn || [];
        this.clusters = clusters;
        this.create();
    }

    create() {
        this.kopsUser = new AwsKopsUser("kops", this.dependsOn);

        this.kopsStateS3 = new AwsS3(`kops-state-store-${this.name.toLowerCase().replace(" ", "-")}-r3eu8ow`, [this.kopsUser.getDependsOn()]);
        const kopsStateStore = `s3://${this.kopsStateS3.bucketName}`;
        //Create clusters
        this.clusters.forEach(cluster => {
            const newEnvironment = {
                KOPS_STATE_STORE: kopsStateStore,
                AWS_ACCESS_KEY_ID: pulumi.interpolate`${this.kopsUser.accessKey.id}`,
                AWS_SECRET_ACCESS_KEY: pulumi.interpolate`${this.kopsUser.accessKey.secret}`,
                ...this.environment
            };

            cluster.create(`${kopsStateStore}`, newEnvironment, this.kopsStateS3.getDependsOn());
            this.clusters_objects.push(cluster.getDependsOn());

        });

    }

    getDependsOn() {
        return this.clusters_objects;
    }


}