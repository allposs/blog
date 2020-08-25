---
title:          103-CentOS7安装harbor
date:           2020-02-23T14:20:23+08:00
draft:          true
tags:           [2020-02]
topics:         [容器,harbor]
---


## 简介

&nbsp;&nbsp;&nbsp;&nbsp;在实际应用 Kubernetes 或者 Docker 容器，往往会在公司内部构建自己的 Docker Registry，这样可以提升下载镜像的速度还可以节约带宽、镜像私有化等一些好处。

&nbsp;&nbsp;&nbsp;&nbsp;本次是采用 Harbor offline installer 方式安装, 也就是二进制安装。
<!--more-->
## 环境

        CentOS Linux release 7.7.1908 (Core)
        Docker version 19.03.8, build afacb8b
        docker-compose version 1.24.0

## 软件包

无

## 拓扑图

无

## 正文
---

### 1. 安装启动Docker
   
    yum --exclude=kernel* update -y
    yum install epel-release -y
    yum install bash-com* net-tools sysstat vim wget telnet privoxy -y
    yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine  -y
    yum install -y yum-utils device-mapper-persistent-data lvm2 -y
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo -y
    yum install docker-ce -y
    usermod -aG docker vagrant
    swapoff -a && sysctl -w vm.swappiness=0 && systemctl stop firewalld && systemctl disable firewalld && setenforce 0 && sed -i 's/SELINUX=permissive/SELINUX=disabled/' /etc/selinux/config && sed -i '/swap/s/^/#/' /etc/fstab
    systemctl enable docker && systemctl start docker
    touch /etc/docker/daemon.json
    cat > /etc/docker/daemon.json << EOF
    {
        "exec-opts": ["native.cgroupdriver=systemd"],
        "log-driver": "json-file",
        "log-opts": {
            "max-size": "100m",
            "max-file": "10"
        },
        "oom-score-adjust": -1000,
        "storage-driver": "overlay2",
        "storage-opts":["overlay2.override_kernel_check=true"],
        "live-restore": false,
        "max-concurrent-downloads": 20,
        "data-root": "/opt/docker",
        "exec-root": "/opt/docker",
        "bridge": "none",
        "debug": true,
        "default-ulimits": {
            "nofile": {
                "Name": "nofile",
                "Hard": 1024000,
                "Soft": 1024000
            },
            "nproc": {
                "Name": "nproc",
                "Hard": 1024000,
                "Soft": 1024000
            },
        "core": {
                "Name": "core",
                "Hard": -1,
                "Soft": -1    
        }

        }
    }
    EOF
    systemctl restart docker 

### 2. 安装 Docker Compose

    curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

### 3. 安装 Harbor

    Harbor 项目地址：https://github.com/goharbor/harbor

#### 1).获取 Harbor 离线安装包

访问 https://github.com/goharbor/harbor/releases 获取 v1.10.1 版的 Harbor offline installer 然后解压


    tar xf harbor-offline-installer-v1.10.1.tgz -C /usr/local/

#### 2). 修改 Harbor 配置文件

    cd /usr/local/harbor/ && mkdir ssl
    vim harbor.cfg
    # 主要修改以下几个参数
    vim harbor.cfg
    # 配置访问 harbor dashboard 的 IP 地址或域名，这里我使用的主机名
    hostname = HNode..example.com
    #证书路径,具体证书制作可以看我博客文字[《003-CFSSL制作证书》](http://blog.allposs.com/post/security/003-cfssl%E5%88%B6%E4%BD%9C%E8%AF%81%E4%B9%A6/)
    certificate: /usr/local/harbor/ssl/server.pem
    private_key: /usr/local/harbor/ssl/server-key.pem
    # harbor 管理员的默认密码，建议修改为其它密码
    harbor_admin_password: Harbor12345

### 3). 运行 install.sh

Harbor 程序包解压后的文件夹内，有个 harbor.v1.10.1.tar.gz ，这里是harbor 所用的所有 docker 镜像，运行 install.sh 会将镜像导入到本地。

    cd /usr/local/harbor/
    ./install.sh

运行成功后会看到如下输出：

    ✔ ----Harbor has been installed and started successfully.----

### 4). harbor自启动

    cat <<EOF > /lib/systemd/system/harbor.service
    [Unit]
    Description=Harbor
    After=docker.service systemd-networkd.service systemd-resolved.service
    Requires=docker.service
    Documentation=http://github.com/vmware/harbor

    [Service]
    Type=simple
    Restart=on-failure
    RestartSec=5
    ExecStart=/usr/local/bin/docker-compose -f  /usr/local/harbor/docker-compose.yml up
    ExecStop=/usr/local/bin/docker-compose -f /usr/local/harbor/docker-compose.yml down

    [Install]
    WantedBy=multi-user.target
    EOF

    systemctl enable harbor && systemctl start harbor
    
---
## 结束
    本次安装结束，此次安装只是简单安装，后续会根据自己的项目情况优化相关内容，请期待后续更新。

