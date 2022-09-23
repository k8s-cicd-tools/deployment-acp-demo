import { OpenPort } from "./OpenPort";
import * as aws from "@pulumi/aws";
import { local } from "@pulumi/command";
import { getSecurityGroupsId } from "./AwsUtils";
import * as pulumi from "@pulumi/pulumi";


export class Cluster {
    name: string;
    masterSize: string;
    masterCount: number;
    awsRegionAzs: string;
    kubernetesVersion: string;
    nodeSize: string;
    nodeCount: number;
    awsRegion: string;
    nodeOpenPorts: OpenPort[] = [];
    kopsProvider: any;
    kopsStateStore: string = "";
    environment: {} = {};
    kopsValidateCluster: any;
    namespaces: any[] = [];

    constructor(name: string, masterSize: string, masterCount: number, awsRegion: string, awsRegionAzs: string, kubernetesVersion: string, nodeSize: string, nodeCount: number) {
        this.name = name;
        this.masterSize = masterSize;
        this.masterCount = masterCount;
        this.awsRegion = awsRegion;
        this.awsRegionAzs = awsRegionAzs;
        this.kubernetesVersion = kubernetesVersion;
        this.nodeSize = nodeSize;
        this.nodeCount = nodeCount;
    }

    addNamespace(namespace: any) {
        this.namespaces.push(namespace);
    }

    addNodeOpenPorts(openPorts: OpenPort[]) {
        this.nodeOpenPorts = this.nodeOpenPorts.concat(openPorts);
        //remove duplicates
        this.nodeOpenPorts = this.nodeOpenPorts.filter((v, i, a) => a.indexOf(v) === i);
    }

    create(kopsStateStore: string, kopsProvider: aws.Provider, environment: {}, dependsOn: any[]) {
        this.kopsStateStore = kopsStateStore;
        this.kopsProvider = kopsProvider;
        this.environment = environment;

        const createCommand = `kops create cluster --name ${this.name} --state ${kopsStateStore} --cloud aws --master-size ${this.masterSize} --master-count ${this.masterCount} --master-zones ${this.awsRegionAzs} --zones ${this.awsRegionAzs} --node-size ${this.nodeSize} --node-count ${this.nodeCount} --dns private --kubernetes-version ${this.kubernetesVersion}`;
        const deleteCommand = `kops delete cluster --name ${this.name} --state ${kopsStateStore} --yes`;
        const newEnvironment = {
            AWS_DEFAULT_REGION: this.awsRegion,
            ...this.environment
        };

        let kopsCreateCluster = new local.Command(`kops create cluster ${this.name}`, {
            create: createCommand,
            delete: deleteCommand,
            environment: newEnvironment
        }, {dependsOn: dependsOn});

        //Kops update cluster
        let kopsUpdateCluster = new local.Command(`kops update cluster ${this.name}`, {
            create: `kops update cluster ${this.name} --yes`,
            environment: newEnvironment
        }, {dependsOn: [kopsCreateCluster]});

        //Kops export kubecfg
        let kopsExportKubecfg = new local.Command(`kops export kubecfg ${this.name}`, {
            create: `kops export kubecfg --admin`,
            environment: newEnvironment
        }, {dependsOn: [kopsUpdateCluster]});

        //Kops validate cluster
        const validateCommand = `kops validate cluster --wait 10m`;
        this.kopsValidateCluster = new local.Command(`kops validate cluster ${this.name}`, {
            create: validateCommand,
            environment: newEnvironment
        }, {dependsOn: [kopsExportKubecfg]});

        //Create namespaces
        this.namespaces.forEach(namespace => {
            namespace.create([this.kopsValidateCluster]);
        });

        // //check if cluster has node open ports > 0
        // if (this.nodeOpenPorts.length > 0) {
        //     const getSecurityGroupsCommand = `aws ec2 describe-security-groups --region ${this.awsRegion} --query 'SecurityGroups[*].{Name:GroupName,ID:GroupId}' --output json > /tmp/security_groups_${this.name}.json`;
        //     //Open ports
        //     this.nodeOpenPorts.forEach(openPort => {
        //         //get all security groups in the region
        //         let securityGroups = new local.Command(`get security groups ${openPort.port}_${openPort.protocol}_${openPort.type}_${this.name}`, {
        //             create: getSecurityGroupsCommand,
        //             environment: newEnvironment
        //         }, {dependsOn: [this.kopsValidateCluster]});
        //
        //         const openPortAws = new aws.ec2.SecurityGroupRule(`open port ${openPort.port}_${openPort.protocol}_${openPort.type}_${this.name}`, {
        //             type: openPort.type,
        //             fromPort: openPort.port,
        //             toPort: openPort.port,
        //             protocol: openPort.protocol,
        //             cidrBlocks: openPort.cidrBlocks,
        //             securityGroupId: pulumi.interpolate`${getSecurityGroupsId(this.name)}`
        //         }, {dependsOn: [securityGroups], provider: this.kopsProvider});
        //     });
        // }
    }

    getDependsOn() {
        return this.kopsValidateCluster;
    }

}