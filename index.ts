import { Mysql } from "./src/apps/Mysql";
import { Grafana } from "./src/apps/Grafana";
import { NameSpace } from "./src/classes/NameSpace";
import { Cluster } from "./src/classes/Cluster";
import { Kops } from "./src/classes/Kops";
import {OpenPort} from "./src/classes/OpenPort";

//create the namespace
const nameSpaceTest = new NameSpace("test", {app: "test"}, []);

//create the mysql app
const appMysqlServer1 = new Mysql("mysql1","5.6", "*", 3306, "2Gi", []);
const grafana = new Grafana("grafana", "latest", 32000, []);
//const acp = new Acp("acp", "latest", 32000, []);

//add the app to the namespace
//nameSpaceTest.addApplication(appMysqlServer1);
nameSpaceTest.addApplication(grafana);

//create the cluster
const cluster = new Cluster(
    "myfirstcluster.k8s.local",
    "t3.medium",
    1,
    "us-east-1",
    "us-east-1a",
    "v1.21.1",
    "t3.medium",
    2
);

//add the namespace to the cluster
cluster.addNamespace(nameSpaceTest);

//Open ports for the cluster
//const openPort80 = new OpenPort("ingress", 80, "tcp", ["0.0.0.0/0"]);
//const openPort443 = new OpenPort("ingress", 443, "tcp", ["0.0.0.0/0"]);
//cluster.addNodeOpenPorts([openPort80, openPort443]);

const kops = new Kops(
    "TestKops",
    "us-east-1",
    [cluster]
);

