import * as fs from 'fs';


export function getSecurityGroupsId(clusterName: string) {
    let securityGroupsJson = JSON.parse(fs.readFileSync(`/tmp/securityGroups_${clusterName}.json`, 'utf8'));
    let securityGroup = securityGroupsJson.find((securityGroup: any) => securityGroup.Name === `nodes.${clusterName}`);
    return securityGroup.ID;
}
