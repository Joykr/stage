import {
	BuildImageCmdOptions,
	ContainerMirrorServiceInfo,
	PullImageCmdOptions,
	UpdateServiceCmdOptions,
	DeployViaPM2CmdOptions,
	DeployServiceCmdOptions,
} from './interface';

export const formatMirrorName = (name: string) => name.replace(/(\.|\@|\_|\/)/g, '-');

export const genBuildImageCmd = (options: BuildImageCmdOptions) => {
	const { mirrorName, mirrorVersion, repoZone, repoNamespace } = options;

	return `
    # 1. build image
    docker build -t ${mirrorName}:${mirrorVersion} .

    # 2. fetch image id
    IMAGE_ID=$(docker image ls -q ${mirrorName}:${mirrorVersion})

    docker tag $IMAGE_ID ${repoZone}/${repoNamespace}/${mirrorName}:${mirrorVersion}

    docker tag $IMAGE_ID ${repoZone}/${repoNamespace}/${mirrorName}:latest
  `;
};

export const genPushImageCmd = (options: ContainerMirrorServiceInfo) => {
	const { owner, userPwd, mirrorName, mirrorVersion, repoZone, repoNamespace } = options;
	return `
    # 1. use free container mirror service and login private repository，recommended:
    #       - aliyun(https://help.aliyun.com/document_detail/257112.html?spm=5176.166170.J_5253785160.5.93cf5164mGxRDG)
    #       - tencent(https://console.cloud.tencent.com/tcr)
    docker login --username=${owner} --password-stdin=${userPwd} ${repoZone}

    # 2. push to your private repository
    docker push ${repoZone}/${repoNamespace}/${mirrorName}:${mirrorVersion}

    docker push ${repoZone}/${repoNamespace}/${mirrorName}:latest
  `;
};

export const genPullImageToServerCmd = (options: PullImageCmdOptions) => {
	const {
		sshPort,
		userName,
		serverIP,
		owner,
		userPwd,
		mirrorName,
		mirrorVersion,
		repoZone,
		repoNamespace,
	} = options;
	return `
    # if you are using docker swarm, please make sure the follow ip address is the master node
    ssh -tt -p ${sshPort} ${userName}@${serverIP} << EOF
    docker login --username=${owner} --password-stdin=${userPwd} ${repoZone}

    docker pull ${repoZone}/${repoNamespace}/${mirrorName}:latest

    docker pull ${repoZone}/${repoNamespace}/${mirrorName}:${mirrorVersion}

    exit
    EOF
  `;
};

export const genCheckServerWorkDirCmd = (options: DeployServiceCmdOptions) => {
	const { sshPort, userName, serverIP, stackName, appDir } = options;

	const workDir = appDir ? appDir : `apps/docker/${stackName}`;

	return `
    ssh -tt -p ${sshPort} ${userName}@${serverIP} << EOF

    if [ ! -d "/home/${userName}/${workDir}" ]; then
      mkdir -p ${workDir}
    else
      rm -rf /home/${userName}/${workDir}/*
    fi

    exit
    EOF
  `;
};

export const genDeployServiceCmd = (options: DeployServiceCmdOptions) => {
	const { sshPort, userName, serverIP, stackName, appDir } = options;

	const workDir = appDir ? appDir : `apps/docker/${stackName}`;

	return `
    CUR_DIR=$(pwd)

    scp -P ${sshPort} -r $CUR_DIR/* ${userName}@${serverIP}:/home/${userName}/${workDir}

    ssh -tt -p ${sshPort} ${userName}@${serverIP} << EOF

    cd /home/${userName}/${workDir}

    docker stack deploy -c stack.yml ${stackName}

    exit
    EOF
  `;
};

export const genUpdateServiceCmd = (options: UpdateServiceCmdOptions) => {
	const { sshPort, userName, serverIP, mirrorName, repoZone, repoNamespace, serviceName } = options;

	return `
    # if you are using docker swarm, please make sure the follow ip address is the master node
    ssh -tt -p ${sshPort} ${userName}@${serverIP} << EOF

    docker service update --image ${repoZone}/${repoNamespace}/${mirrorName}:latest ${serviceName}
    exit
    EOF
  `;
};

export const genDeployServiceViaPM2Cmd = (options: DeployViaPM2CmdOptions) => {
	const { sshPort, userName, serverIP, appDir = 'apps/pm2' } = options;

	if (appDir === '/') {
		throw new Error(
			`Dangerous!!! the deploy directory must not the root directory of host machine`,
		);
	}

	return `
    ssh -tt -p ${sshPort} ${userName}@${serverIP} << EOF

    if [ ! -d "$HOME/${appDir}" ]; then
      mkdir $HOME/${appDir}
    else
      rm -rf $HOME/${appDir}/*
    fi

    exit
    EOF

    CUR_DIR=$(pwd)

    scp -P ${sshPort} -r $CUR_DIR/* ${userName}@${serverIP}:${appDir}
  `;
};
