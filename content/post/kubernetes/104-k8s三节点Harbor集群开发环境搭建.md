---
title:          104-k8三节点Harbor集群开发环境搭建
date:           2020-04-02T14:20:23+08:00
draft:          true
tags:           [2020-04]
topics:         [容器,kubernetes]
---


## 简介


<!--more-->
## 环境
        IP Address	    Role	CPU	Memory    Type
        172.20.0.211	KNode1	2	  2G      master
        172.20.0.212	KNode2	2	  2G      node
        172.20.0.213	KNode3	2	  2G      node
        172.20.0.214	KNode4	2	  2G      harbor
        172.20.0.215	KNode5	2	  2G      harbor

    Vagrant.configure("2") do |config|

    	(1..5).each do |i|

    		config.vm.define "KNode#{i}" do |node|

    		# 设置虚拟机的Box
    		node.vm.box = "bento/centos-7.6"

    		# 设置虚拟机的主机名
    		node.vm.hostname="KNode#{i}"

    		# 设置虚拟机的IP
    		node.vm.network "private_network", ip: "172.20.0.21#{i}"

    		# 设置主机与虚拟机的共享目录
    		#node.vm.synced_folder "/Users/temp/Development/vagrant/k8s", "/vagrant/share"

    		# VirtaulBox相关配置
    		node.vm.provider "virtualbox" do |v|

    			# 设置虚拟机的名称
    			v.name = "KNode#{i}"

    			# 设置虚拟机的内存大小  
    			v.memory = 2048

    			# 设置虚拟机的CPU个数
    			v.cpus = 2
    		    end
            end
    	end
    end


## 软件包

无

## 拓扑图

无

## 正文
---

### 1. 主机优化与基础软件安装（所有Node）

#### 1.1 优化说明

    主机swap： 在使用容器的方式运行应用的时候,尽量避免让容器使用swap,所以这里针对swap进行优化。
    防火墙： 由于是开发环境，防火墙全关，虽然这会导致主机不安全。如果想开启防火墙的话，需要使用firewalld命令开通相关端口。
    SELINUX： 如果你不想因为各种安全机制导致安装集群失败的话最好关闭。

    yum --exclude=kernel* update -y
    yum install epel-release -y
    yum install bash-com* net-tools sysstat vim wget telnet -y
    yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine  -y
    yum install -y yum-utils device-mapper-persistent-data lvm2 -y
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo -y
    yum install docker-ce -y
    usermod -aG docker vagrant
    swapoff -a && sysctl -w vm.swappiness=0 && systemctl stop firewalld && systemctl disable firewalld && setenforce 0 && sed -i 's/SELINUX=permissive/SELINUX=disabled/' /etc/selinux/config && sed -i     '/swap/s/^/#/' /etc/fstab

    cat > /etc/sysconfig/modules/ipvs.modules <<EOF
    #!/bin/bash
    modprobe -- br_netfilter
    modprobe -- ip_vs
    modprobe -- ip_vs_rr
    modprobe -- ip_vs_wrr
    modprobe -- ip_vs_sh
    modprobe -- nf_conntrack_ipv4
    EOF
    cat <<EOF > /etc/sysctl.d/k8s.conf
    net.ipv4.ip_forward = 1
    net.bridge.bridge-nf-call-ip6tables = 1
    net.bridge.bridge-nf-call-iptables = 1
    EOF
    chmod 755 /etc/sysconfig/modules/ipvs.modules && \
    bash /etc/sysconfig/modules/ipvs.modules && \
    lsmod | grep -E "ip_vs|nf_conntrack_ipv4" && sysctl -p /etc/sysctl.d/k8s.conf
    cat <<EOF >> /etc/hosts
    172.20.0.211 KNode1 KNode1.example.com
    172.20.0.212 KNode2 KNode2.example.com
    172.20.0.213 KNode3 KNode3.example.com
    172.20.0.214 KNode4 KNode4.example.com
    172.20.0.215 KNode5 KNode5.example.com
    EOF

    #docker代理优化(可选)
    sed -i 's@ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock@ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:2375 --containerd=/run/containerd/containerd.sock @'    /lib/systemd/system/docker.service
    sed -i '/Type=notify/a\Environment="HTTP_PROXY=http://127.0.0.1:8118/" "HTTPS_PROXY=http://127.0.0.1:8118" "NO_PROXY=localhost,127.0.0.1,fsw1qay4.mirror.aliyuncs.com"' /lib/systemd/system/docker. service

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

### 2.证书配置(Node1)

    export CFSSL_URL="https://pkg.cfssl.org/R1.2"
    wget "${CFSSL_URL}/cfssl_linux-amd64" -O /usr/bin/cfssl
    wget "${CFSSL_URL}/cfssljson_linux-amd64" -O /usr/bin/cfssljson
    wget "${CFSSL_URL}/cfssl-certinfo_linux-amd64" -O /usr/bin/cfssl-certinfo
    chmod +x /usr/bin/cfssl /usr/bin/cfssljson /usr/bin/cfssl-certinfo && mkdir -p /vagrant/ssl && cd /vagrant/ssl
    cat <<EOF > ca-config.json
    {
        "signing": {
            "default": {
                "expiry": "43800h"
            },
            "profiles": {
                "server": {
                    "expiry": "43800h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "server auth"
                    ]
                },
                "client": {
                    "expiry": "43800h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "client auth"
                    ]
                },
                "peer": {
                    "expiry": "43800h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "server auth",
                        "client auth"
                    ]
                }
            }
        }
    }
    EOF

    cat <<EOF > ca-csr.json
    {
        "CN": "Self Signed CA",
        "key": {
            "algo": "rsa",
            "size": 2048
        },
        "names": [
            {
                "C": "CN",
                "L": "ShangHai",
                "O": "allposs Personal",
                "ST": "SH",            
                "OU": "allposs",
                "CN": "allposs Personal Tester CA",
                "emailAddress": "allposs@allposs.com"
            }    ]
    }
    EOF


    cfssl gencert -initca ca-csr.json | cfssljson -bare ca -

    cat <<EOF > etcd-server-csr.json
    {
        "CN": "etcd-server",
        "hosts": [
            "127.0.0.1","172.20.0.211","172.20.0.212","172.20.0.213","KNode1.example.com","KNode2.example.com","KNode3.example.com","10.0.2.15"
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "ShangHai",
                "O": "allposs Personal",
                "ST": "SH",            
                "OU": "allposs",
                "CN": "allposs Personal Tester CA",
                "emailAddress": "allposs@allposs.com"
            }
        ]
    }
    EOF

    cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=server etcd-server-csr.json | cfssljson -bare etcd-server



    cat <<EOF > etcd-client-csr.json
    {
        "CN": "etcd-client",
        "hosts": [],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "ShangHai",
                "O": "allposs Personal",
                "ST": "SH",            
                "OU": "allposs",
                "CN": "allposs Personal Tester CA",
                "emailAddress": "allposs@allposs.com"
            }
        ]
    }
    EOF

    cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=client etcd-client-csr.json | cfssljson -bare etcd-client



    cat <<EOF > etcd-peer-csr.json
    {
        "CN": "etcd-peer",
        "hosts": [
            "127.0.0.1","172.20.0.211","172.20.0.212","172.20.0.213","172.20.0.214","172.20.0.215","KNode1.example.com","KNode2.example.com","KNode3.example.com","KNode4.example.com","KNode5.example.com","10.0.2.15"
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "ShangHai",
                "O": "allposs Personal",
                "ST": "SH",            
                "OU": "allposs",
                "CN": "allposs Personal Tester CA",
                "emailAddress": "allposs@allposs.com"
            }
        ]
    }
    EOF

    cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=peer etcd-peer-csr.json | cfssljson -bare etcd-peer


    cat <<EOF > harbor-server-csr.json
    {
        "CN": "harbor-server",
        "hosts": [
            "127.0.0.1","172.20.0.214","172.20.0.215","KNode4.example.com","KNode5.example.com","10.0.2.15"
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "ShangHai",
                "O": "allposs Personal",
                "ST": "SH",            
                "OU": "allposs",
                "CN": "allposs Personal Tester CA",
                "emailAddress": "allposs@allposs.com"
            }
        ]
    }
    EOF

    cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=server harbor-server-csr.json | cfssljson -bare harbor-server


### 3.ETCD集群安装配置

#### 3.1 安装说明



#### 3.1.1 KNode1节点配置

    cd /vagrant && wget https://github.com/etcd-io/etcd/releases/download/v3.3.18/etcd-v3.3.18-linux-amd64.tar.gz
    tar xf /vagrant/etcd-v3.3.18-linux-amd64.tar.gz && mv etcd-v3.3.18-linux-amd64/etcd* /usr/bin/ && rm -rf etcd-v3.3.18-linux-amd64
    mkdir /etc/etcd/ssl/ -p && cd /etc/etcd/ssl/ &&  cp /vagrant/ssl/{etcd-server.pem,etcd-server-key.pem,etcd-peer.pem,etcd-peer-key.pem,etcd-client-key.pem,etcd-client.pem,ca.pem} .
    cat <<EOF >/etc/etcd/etcd.conf
    # [member]
    ETCD_NAME=KNode1
    ETCD_DATA_DIR=/opt/etcd
    ETCD_LISTEN_PEER_URLS=https://0.0.0.0:2380
    ETCD_LISTEN_CLIENT_URLS=https://0.0.0.0:2379
    ETCD_PROXY=off
    # [cluster]
    ETCD_ADVERTISE_CLIENT_URLS=https://172.20.0.211:2379
    ETCD_INITIAL_ADVERTISE_PEER_URLS=https://172.20.0.211:2380
    ETCD_INITIAL_CLUSTER="KNode1=https://172.20.0.211:2380,KNode2=https://172.20.0.212:2380,KNode3=https://172.20.0.213:2380"
    ETCD_INITIAL_CLUSTER_STATE=new
    ETCD_INITIAL_CLUSTER_TOKEN=etcd-k8s-cluster
    # [security]
    ETCD_CERT_FILE="/etc/etcd/ssl/etcd-server.pem"
    ETCD_KEY_FILE="/etc/etcd/ssl/etcd-server-key.pem"
    ETCD_CLIENT_CERT_AUTH="true"
    ETCD_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_AUTO_TLS="true"
    ETCD_PEER_CERT_FILE="/etc/etcd/ssl/etcd-peer.pem"
    ETCD_PEER_KEY_FILE="/etc/etcd/ssl/etcd-peer-key.pem"
    ETCD_PEER_CLIENT_CERT_AUTH="true"
    ETCD_PEER_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_PEER_AUTO_TLS="true"
    EOF

#### 3.1.2 KNode2节点配置

    mkdir /etc/etcd/ssl/ -p && cd /etc/etcd/ssl/ &&  cp /vagrant/ssl/{etcd-server.pem,etcd-server-key.pem,etcd-peer.pem,etcd-peer-key.pem,etcd-client-key.pem,etcd-client.pem,ca.pem} .
    tar xf /vagrant/etcd-v3.3.18-linux-amd64.tar.gz && mv etcd-v3.3.18-linux-amd64/etcd* /usr/bin/ && rm -rf etcd-v3.3.18-linux-amd64
    cat <<EOF >/etc/etcd/etcd.conf
    # [member]
    ETCD_NAME=KNode2
    ETCD_DATA_DIR=/opt/etcd
    ETCD_LISTEN_PEER_URLS=https://0.0.0.0:2380
    ETCD_LISTEN_CLIENT_URLS=https://0.0.0.0:2379
    ETCD_PROXY=off
    # [cluster]
    ETCD_ADVERTISE_CLIENT_URLS=https://172.20.0.212:2379
    ETCD_INITIAL_ADVERTISE_PEER_URLS=https://172.20.0.212:2380
    ETCD_INITIAL_CLUSTER="KNode1=https://172.20.0.211:2380,KNode2=https://172.20.0.212:2380,KNode3=https://172.20.0.213:2380"
    ETCD_INITIAL_CLUSTER_STATE=new
    ETCD_INITIAL_CLUSTER_TOKEN=etcd-k8s-cluster
    # [security]
    ETCD_CERT_FILE="/etc/etcd/ssl/etcd-server.pem"
    ETCD_KEY_FILE="/etc/etcd/ssl/etcd-server-key.pem"
    ETCD_CLIENT_CERT_AUTH="true"
    ETCD_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_AUTO_TLS="true"
    ETCD_PEER_CERT_FILE="/etc/etcd/ssl/etcd-peer.pem"
    ETCD_PEER_KEY_FILE="/etc/etcd/ssl/etcd-peer-key.pem"
    ETCD_PEER_CLIENT_CERT_AUTH="true"
    ETCD_PEER_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_PEER_AUTO_TLS="true"
    EOF

#### 3.1.3 KNode3节点配置

    mkdir /etc/etcd/ssl/ -p && cd /etc/etcd/ssl/ &&  cp /vagrant/ssl/{etcd-server.pem,etcd-server-key.pem,etcd-peer.pem,etcd-peer-key.pem,etcd-client-key.pem,etcd-client.pem,ca.pem} .
    tar xf /vagrant/etcd-v3.3.18-linux-amd64.tar.gz && mv etcd-v3.3.18-linux-amd64/etcd* /usr/bin/ && rm -rf etcd-v3.3.18-linux-amd64

    cat <<EOF >/etc/etcd/etcd.conf
    # [member]
    ETCD_NAME=KNode3
    ETCD_DATA_DIR=/opt/etcd
    ETCD_LISTEN_PEER_URLS=https://0.0.0.0:2380
    ETCD_LISTEN_CLIENT_URLS=https://0.0.0.0:2379
    ETCD_PROXY=off
    # [cluster]
    ETCD_ADVERTISE_CLIENT_URLS=https://172.20.0.213:2379
    ETCD_INITIAL_ADVERTISE_PEER_URLS=https://172.20.0.213:2380
    ETCD_INITIAL_CLUSTER="KNode1=https://172.20.0.211:2380,KNode2=https://172.20.0.212:2380,KNode3=https://172.20.0.213:2380"
    ETCD_INITIAL_CLUSTER_STATE=new
    ETCD_INITIAL_CLUSTER_TOKEN=etcd-k8s-cluster
    # [security]
    ETCD_CERT_FILE="/etc/etcd/ssl/etcd-server.pem"
    ETCD_KEY_FILE="/etc/etcd/ssl/etcd-server-key.pem"
    ETCD_CLIENT_CERT_AUTH="true"
    ETCD_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_AUTO_TLS="true"
    ETCD_PEER_CERT_FILE="/etc/etcd/ssl/etcd-peer.pem"
    ETCD_PEER_KEY_FILE="/etc/etcd/ssl/etcd-peer-key.pem"
    ETCD_PEER_CLIENT_CERT_AUTH="true"
    ETCD_PEER_TRUSTED_CA_FILE="/etc/etcd/ssl/ca.pem"
    ETCD_PEER_AUTO_TLS="true"
    EOF

#### 3.2 Systemd脚本配置(KNode1-KNode3)

    cat <<EOF > /lib/systemd/system/etcd.service
    [Unit]
    Description=Etcd Service
    After=network.target
    [Service]
    Environment=ETCD_DATA_DIR=/var/lib/etcd/default
    EnvironmentFile=-/etc/etcd/etcd.conf
    Type=notify
    User=etcd
    PermissionsStartOnly=true
    ExecStart=/usr/bin/etcd
    Restart=on-failure
    RestartSec=10
    LimitNOFILE=65536
    [Install]
    WantedBy=multi-user.target
    EOF

#### 3.3 启动ETCD集群(KNode1-KNode3)


    groupadd etcd && useradd -c "Etcd user" -g etcd -s /sbin/nologin -r etcd && mkdir -p /opt/etcd && chown etcd:etcd -R /opt/etcd /etc/etcd
    systemctl enable etcd.service && systemctl start etcd.service


#### 3.4 验证集群

    etcdctl --ca-file /etc/etcd/ssl/ca.pem --cert-file /etc/etcd/ssl/etcd-client.pem --key-file /etc/etcd/ssl/etcd-client-key.pem --endpoints=https://172.20.0.211:2379,https://172.20.0.212:2379,https://172.20.0.213:2379 member list


### 4.kubernetes集群安装(KNode1)

#### 4.1 安装说明

kubernetes集群使用私有证书：

默认情况下, kubeadm 会生成运行一个集群所需的全部证书。 你可以通过提供你自己的证书来改变这个行为策略。如果要这样做, 你必须将证书文件放置在通过 --cert-dir 命令行参数或者配置文件里的 CertificatesDir 配置项指明的目录中。默认的值是 /etc/kubernetes/pki。如果在运行 kubeadm init 之前存在给定的证书和私钥对，则 kubeadm 将不会重写它们。例如，这意味着您可以将现有的 CA 复制到 /etc/kubernetes/pki/ca.crt 和 /etc/kubernetes/pki/ca.key 中，而 kubeadm 将使用此 CA 对其余证书进行签名。

kubernetes外部CA证书：

如果只提供了 ca.crt 文件但是没有提供 ca.key 文件也是可以的 (这只对 CA 根证书可用，其它证书不可用)。 如果所有的其它证书和 kubeconfig 文件已就绪， kubeadm 检测到满足以上条件就会激活 “外部 CA” 模式。kubeadm 将会在没有 CA 密钥文件的情况下继续执行。否则, kubeadm 将独立运行 controller-manager，附加一个 --controllers=csrsigner 的参数，并且指明 CA 证书和密钥。

这里我使用私有证书方式安装,如果让kubernetes自动生成证书,可以不执行下面命令:

    mkdir /etc/kubernetes/pki -p
    cp /vagrant/ssl/ca.pem /etc/kubernetes/pki/ca.crt -f 
    cp /vagrant/ssl/ca-key.pem /etc/kubernetes/pki/ca.key  -f 



国内安装：

由于国内政策原因,导致在使用kubeadm安装kubernetes集群时会拉取不到镜像。接近方法有两种：一种是使用代理、一种是提前准备镜像,然后在要安装的docker主机上导入镜像。这里介绍的是使用镜像文件导入的方式,也就是第二种,至于第一种请看我前面的文档。
查看kubeadm版本

    kubeadm version
    kubeadm version: &version.Info{Major:"1", Minor:"18", GitVersion:"v1.18.2", GitCommit:"52c56ce7a8272c798dbc29846288d7cd9fbae032", GitTreeState:"clean", BuildDate:"2020-04-16T11:54:15Z",   GoVersion:"go1.13.9", Compiler:"gc", Platform:"linux/amd64"}


所需要的镜像(kubernetes v1.18.0,calico v3.10.3,coredns 1.6.7 ):

Master节点：

    # docker images
    REPOSITORY                           TAG                 IMAGE ID            CREATED             SIZE
    k8s.gcr.io/kube-proxy                v1.18.0             43940c34f24f        7 weeks ago         117MB
    k8s.gcr.io/kube-apiserver            v1.18.0             74060cea7f70        7 weeks ago         173MB
    k8s.gcr.io/kube-controller-manager   v1.18.0             d3e55153f52f        7 weeks ago         162MB
    k8s.gcr.io/kube-scheduler            v1.18.0             a31f78c7c8ce        7 weeks ago         95.3MB
    k8s.gcr.io/pause                     3.2                 80d28bedfe5d        3 months ago        683kB
    k8s.gcr.io/coredns                   1.6.7               67da37a9a360        3 months ago        43.8MB
    calico/node                          v3.10.3             6c2199647d1c        4 months ago        192MB
    calico/cni                           v3.10.3             34ffdb0b77aa        4 months ago        163MB
    calico/kube-controllers              v3.10.3             ac5e9765205b        4 months ago        50.6MB
    calico/pod2daemon-flexvol            v3.10.3             35001c355868        4 months ago        9.78MB

Node节点：

    # docker images
    REPOSITORY                  TAG                 IMAGE ID            CREATED             SIZE
    k8s.gcr.io/kube-proxy       v1.18.0             43940c34f24f        7 weeks ago         117MB
    k8s.gcr.io/pause            3.2                 80d28bedfe5d        3 months ago        683kB
    calico/node                 v3.10.3             6c2199647d1c        4 months ago        192MB
    calico/cni                  v3.10.3             34ffdb0b77aa        4 months ago        163MB
    calico/pod2daemon-flexvol   v3.10.3             35001c355868        4 months ago        9.78MB


镜像导出:

    docker save 43940c34f24f  > /vagrant/images/k8s.gcr.io_kube-proxy_v1.18.0
    docker save 74060cea7f70  > /vagrant/images/k8s.gcr.io_kube-apiserver_v1.18.0
    docker save d3e55153f52f  > /vagrant/images/k8s.gcr.io_kube-controller-manager_v1.18.0
    docker save a31f78c7c8ce  > /vagrant/images/k8s.gcr.io_kube-scheduler_v1.18.0
    docker save 80d28bedfe5d  > /vagrant/images/k8s.gcr.io_pause_3.2    
    docker save 67da37a9a360  > /vagrant/images/k8s.gcr.io_coredns_1.6.7  
    docker save 6c2199647d1c  > /vagrant/images/calico_node_v3.10.3
    docker save 34ffdb0b77aa  > /vagrant/images/calico_cni_v3.10.3
    docker save ac5e9765205b  > /vagrant/images/calico_kube-controllers_v3.10.3
    docker save 35001c355868  > /vagrant/images/calico_pod2daemon-flexvol_v3.10.3

镜像导入

Master节点：

    docker load < /vagrant/images/k8s.gcr.io_kube-proxy_v1.18.0
    docker load < /vagrant/images/k8s.gcr.io_kube-apiserver_v1.18.0
    docker load < /vagrant/images/k8s.gcr.io_kube-controller-manager_v1.18.0
    docker load < /vagrant/images/k8s.gcr.io_kube-scheduler_v1.18.0
    docker load < /vagrant/images/k8s.gcr.io_pause_3.2    
    docker load < /vagrant/images/k8s.gcr.io_coredns_1.6.7  
    docker load < /vagrant/images/calico_node_v3.10.3
    docker load < /vagrant/images/calico_cni_v3.10.3
    docker load < /vagrant/images/calico_kube-controllers_v3.10.3
    docker load < /vagrant/images/calico_pod2daemon-flexvol_v3.10.3

Node节点：

    docker load < /vagrant/images/k8s.gcr.io_kube-proxy_v1.18.0
    docker load < /vagrant/images/k8s.gcr.io_pause_3.2
    docker load < /vagrant/images/calico_node_v3.10.3 
    docker load < /vagrant/images/calico_cni_v3.10.3
    docker load < /vagrant/images/calico_pod2daemon-flexvol_v3.10.3

修改Tag

Master节点：

    # docker images
    REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
    <none>              <none>              43940c34f24f        7 weeks ago         117MB
    <none>              <none>              d3e55153f52f        7 weeks ago         162MB
    <none>              <none>              a31f78c7c8ce        7 weeks ago         95.3MB
    <none>              <none>              74060cea7f70        7 weeks ago         173MB
    <none>              <none>              80d28bedfe5d        3 months ago        683kB
    <none>              <none>              67da37a9a360        3 months ago        43.8MB
    <none>              <none>              6c2199647d1c        4 months ago        192MB
    <none>              <none>              34ffdb0b77aa        4 months ago        163MB
    <none>              <none>              ac5e9765205b        4 months ago        50.6MB
    <none>              <none>              35001c355868        4 months ago        9.78MB


    docker tag 43940c34f24f  k8s.gcr.io/kube-proxy:v1.18.0
    docker tag 74060cea7f70  k8s.gcr.io/kube-apiserver:v1.18.0
    docker tag d3e55153f52f  k8s.gcr.io/kube-controller-manager:v1.18.0
    docker tag a31f78c7c8ce  k8s.gcr.io/kube-scheduler:v1.18.0
    docker tag 80d28bedfe5d  k8s.gcr.io/pause:3.2    
    docker tag 67da37a9a360  k8s.gcr.io/coredns:1.6.7  
    docker tag 6c2199647d1c  calico/node:v3.10.3
    docker tag 34ffdb0b77aa  calico/cni:v3.10.3
    docker tag ac5e9765205b  calico/kube-controllers:v3.10.3
    docker tag 35001c355868  calico/pod2daemon-flexvol:v3.10.3


    # docker images
    REPOSITORY                           TAG                 IMAGE ID            CREATED             SIZE
    k8s.gcr.io/kube-proxy                v1.18.0             43940c34f24f        7 weeks ago         117MB
    k8s.gcr.io/kube-apiserver            v1.18.0             74060cea7f70        7 weeks ago         173MB
    k8s.gcr.io/kube-controller-manager   v1.18.0             d3e55153f52f        7 weeks ago         162MB
    k8s.gcr.io/kube-scheduler            v1.18.0             a31f78c7c8ce        7 weeks ago         95.3MB
    k8s.gcr.io/pause                     3.2                 80d28bedfe5d        3 months ago        683kB
    k8s.gcr.io/coredns                   1.6.7               67da37a9a360        3 months ago        43.8MB
    calico/node                          v3.10.3             6c2199647d1c        4 months ago        192MB
    calico/cni                           v3.10.3             34ffdb0b77aa        4 months ago        163MB
    calico/kube-controllers              v3.10.3             ac5e9765205b        4 months ago        50.6MB
    calico/pod2daemon-flexvol            v3.10.3             35001c355868        4 months ago        9.78MB

Node节点：

    # docker images
    REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
    <none>              <none>              43940c34f24f        7 weeks ago         117MB
    <none>              <none>              80d28bedfe5d        3 months ago        683kB
    <none>              <none>              6c2199647d1c        4 months ago        192MB
    <none>              <none>              34ffdb0b77aa        4 months ago        163MB
    <none>              <none>              35001c355868        4 months ago        9.78MB

    docker tag 43940c34f24f  k8s.gcr.io/kube-proxy:v1.18.0
    docker tag 80d28bedfe5d  k8s.gcr.io/pause:3.2  
    docker tag 6c2199647d1c  calico/node:v3.10.3
    docker tag 34ffdb0b77aa  calico/cni:v3.10.3
    docker tag 35001c355868  calico/pod2daemon-flexvol:v3.10.3

    # docker images
    REPOSITORY                  TAG                 IMAGE ID            CREATED             SIZE
    k8s.gcr.io/kube-proxy       v1.18.0             43940c34f24f        7 weeks ago         117MB
    k8s.gcr.io/pause            3.2                 80d28bedfe5d        3 months ago        683kB
    calico/node                 v3.10.3             6c2199647d1c        4 months ago        192MB
    calico/cni                  v3.10.3             34ffdb0b77aa        4 months ago        163MB
    calico/pod2daemon-flexvol   v3.10.3             35001c355868        4 months ago        9.78MB


内网安装：

RPM包：

   通过有网络的机器下载rpm包，命令如下：

    yum install yum-utils -y
    yumdownloader kubelet kubeadm kubectl --resolve --destdir=/vagrant/rpm/

    安装命令

    yum localinstall kubelet kubeadm kubectl

容器镜像：

    国内安装的方式安装


ps: 默认IMAGE ID是MD5值,是不会变的,在批量导入时可以用来判断是否导入正确

#### 4.2 配置YUM源

    cat <<EOF > /etc/yum.repos.d/kubernetes.repo
    [kubernetes]
    name=Kubernetes
    baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
    enabled=1
    gpgcheck=1
    repo_gpgcheck=1
    gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
    EOF

ps:由于官网未开放同步方式, 可能会有索引gpg检查失败的情况, 这时请用 yum install -y --nogpgcheck,具体内容情况阿里源官网   https://developer.aliyun.com/mirror/

#### 4.3  安装kubelet kubeadm kubectl应用包


    yum install -y kubelet kubeadm kubectl
    systemctl enable kubelet && sudo systemctl start kubelet


#### 4.4 配置init文件

打印默认配置

    kubeadm config print init-defaults

    kubeadm token generate
    9r0vjb.39qh4n1n38wodio2


    cat <<EOF > /vagrant/kubeadm.conf
    apiVersion: kubeadm.k8s.io/v1beta2
    bootstrapTokens:
    - groups:
      - system:bootstrappers:kubeadm:default-node-token
      token: 9r0vjb.39qh4n1n38wodio2
      ttl: 24h0m0s
      usages:
      - signing
      - authentication
    kind: InitConfiguration
    localAPIEndpoint:
      advertiseAddress: 172.20.0.211
      bindPort: 6443
    nodeRegistration:
      criSocket: /var/run/dockershim.sock
      name: KNode1
      taints:
      - effect: NoSchedule
        key: node-role.kubernetes.io/master
    ---
    apiServer:
      timeoutForControlPlane: 4m0s
    apiVersion: kubeadm.k8s.io/v1beta2
    certificatesDir: /etc/kubernetes/pki
    clusterName: kubernetes
    controllerManager: {}
    dns:
      type: CoreDNS
    etcd:
      external:
        endpoints:
        - https://172.20.0.211:2379
        - https://172.20.0.212:2379
        - https://172.20.0.213:2379
        caFile: /etc/etcd/ssl/ca.pem
        certFile: /etc/etcd/ssl/etcd-client.pem
        keyFile: /etc/etcd/ssl/etcd-client-key.pem
    imageRepository: k8s.gcr.io
    kind: ClusterConfiguration
    kubernetesVersion: v1.18.0
    networking:
      dnsDomain: cluster.local
      serviceSubnet: 10.224.0.0/16
    scheduler: {}
    EOF

#### 4.5 初始化Master节点

    kubeadm init --config kubeadm.conf

成功后提示：

    kubeadm join 172.20.0.211:6443 --token 9r0vjb.39qh4n1n38wodio2 \
        --discovery-token-ca-cert-hash sha256:05cc4f11e3d1823f99838dc87509820ef25b885bcea1122bc22bd3105584b96c

#### 4.6 验证

    export KUBECONFIG=/etc/kubernetes/admin.conf
    echo "export KUBECONFIG=/etc/kubernetes/admin.conf" >> ~/.bash_profile
    kubectl get pod --all-namespaces


### 5. 安装calico

#### 5.1 安装说明

    安装calico有几种情况，具体看calico官网，这里是使用etcd数据存储安装Calico,也就是使用独立的etcd集群安装Calico,具体内容这里不详细说明，具体还是阅读官网。https://docs.projectcalico.org/

#### 5.2 配置calico.yaml

    curl https://docs.projectcalico.org/v3.10/manifests/calico-etcd.yaml -o calico.yaml
    sed -i 's@.*etcd_endpoints:.*@\ \ etcd_endpoints:\ \"https://172.20.0.211:2379,https://172.20.0.212:2379,https://172.20.0.213:2379\"@gi' calico.yaml
    export ETCD_CERT=`cat /etc/etcd/ssl/etcd-client.pem | base64 | tr -d '\n'`
    export ETCD_KEY=`cat /etc/etcd/ssl/etcd-client-key.pem | base64 | tr -d '\n'`
    export ETCD_CA=`cat /etc/etcd/ssl/ca.pem | base64 | tr -d '\n'`


    sed -i "s@.*etcd-cert:.*@\ \ etcd-cert:\ ${ETCD_CERT}@gi" calico.yaml
    sed -i "s@.*etcd-key:.*@\ \ etcd-key:\ ${ETCD_KEY}@gi" calico.yaml
    sed -i "s@.*etcd-ca:.*@\ \ etcd-ca:\ ${ETCD_CA}@gi" calico.yaml

    sed -i 's@.*etcd_ca:.*@\ \ etcd_ca:\ "/calico-secrets/etcd-ca"@gi' calico.yaml
    sed -i 's@.*etcd_cert:.*@\ \ etcd_cert:\ "/calico-secrets/etcd-cert"@gi' calico.yaml
    sed -i 's@.*etcd_key:.*@\ \ etcd_key:\ "/calico-secrets/etcd-key"@gi' calico.yaml

    sed -i 's@192.168.0.0/16@10.85.0.0/16@gi' calico.yaml


#### 5.3 安装calico(KNode1)

    kubectl create -f calico.yaml




### 6. Node 节点配置(KNode2-3)

#### 6.1 安装说明
    安装Node节点相对Master节点来说少安装了kubectl RPM包，镜像方面也少了kube-apiserver、kube-controller-manager、kube-scheduler、coredns和calico的kube-controllers.

#### 6.2 安装kubelet kubeadm

    cat <<EOF > /etc/yum.repos.d/kubernetes.repo
    [kubernetes]
    name=Kubernetes
    baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
    enabled=1
    gpgcheck=1
    repo_gpgcheck=1
    gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
    EOF
    yum install -y kubelet kubeadm
    systemctl enable kubelet && sudo systemctl start kubelet


#### 6.3 节点加入集群

    kubeadm join 172.20.0.211:6443 --token 9r0vjb.39qh4n1n38wodio2 \
    --discovery-token-ca-cert-hash sha256:05cc4f11e3d1823f99838dc87509820ef25b885bcea1122bc22bd3105584b96c


#### 6.4 验证

    kubectl get pod --all-namespaces
    kubectl get nodes


ps 注意路由情况，如果主机默认路由有异常，或者是我这种使用双网卡的主机，都要调整路由到节点互通的网卡。

    ip route add 10.224.0.0/16 dev eth1




#### 7 Harbor安装(KNode4-5)
#### 7.1 安装说明

#### 7.2 安装配置docker-compose

    cd /vagrant/ && curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose && ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose



#### 7.3 安装配置Harbor

### 7.3.1 下载harbor安装包

    cd /vagrant/ && wget https://github.com/goharbor/harbor/releases/download/v1.10.1/harbor-offline-installer-v1.10.1.tgz

#### 7.3.1 KNode4节点

    cd /vagrant/ && tar xf harbor-offline-installer-v1.10.1.tgz -C /usr/local/ && cd /usr/local/harbor/ && mkdir ssl && cp /vagrant/ssl/{harbor-server.pem,harbor-server-key.pem} ssl/
    cd /usr/local/harbor/
    sed -i 's@hostname: reg.mydomain.com@hostname: KNode4.example.com@gi' harbor.yml
    sed -i 's@certificate: /your/certificate/path@certificate: /usr/local/harbor/ssl/harbor-server.pem@gi' harbor.yml
    sed -i 's@private_key: /your/private/key/path@private_key: /usr/local/harbor/ssl/harbor-server-key.pem@gi' harbor.yml

    cd /usr/local/harbor/ && ./install.sh

#### 7.3.2 KNode5节点

    cd /vagrant/ && tar xf harbor-offline-installer-v1.10.1.tgz -C /usr/local/ && cd /usr/local/harbor/ && mkdir ssl && cp /vagrant/ssl/{harbor-server.pem,harbor-server-key.pem} ssl/
    cd /usr/local/harbor/
    sed -i 's@hostname: reg.mydomain.com@hostname: KNode5.example.com@gi' harbor.yml
    sed -i 's@certificate: /your/certificate/path@certificate: /usr/local/harbor/ssl/harbor-server.pem@gi' harbor.yml
    sed -i 's@private_key: /your/private/key/path@private_key: /usr/local/harbor/ssl/harbor-server-key.pem@gi' harbor.yml
    cd /usr/local/harbor/ && ./install.sh


### 8. k8s集群使用harbor(KNode1-3)
    说明: 如果想在k8s部署时自动拉取镜像，有两种方案，一种是docker认证，一种是k8s的secret，两种方式都需要在dockr目录创建登陆仓库的CA证书文件。

    mkdir /etc/docker/certs.d/harbor.example.com/ -p && cp /vagrant/etcd/ssl/ca.pem /etc/docker/certs.d/harbor.example.com/ca.crt
    sed -i 's/^Environment="HTTP_PROXY/#&/' /lib/systemd/system/docker.service
    systemctl daemon-reload && systemctl restart docker
    docker login harbor.example.com

    WARNING! Your password will be stored unencrypted in /root/.docker/config.json.
    Configure a credential helper to remove this warning. See
    https://docs.docker.com/engine/reference/commandline/login/#credentials-store
    Login Succeeded

    cat ~/.docker/config.json
    {
            "auths": {
                    "harbor.example.com": {
                            "auth": "YWRtaW46SGFyYm9yMTIzNDU="
                    }
            },
            "HttpHeaders": {
                    "User-Agent": "Docker-Client/19.03.8 (linux)"
            }
    }



    docker pull nginx
    docker tag docker.io/library/nginx:latest HNode1.example.com/library/nginx:latest
    docker push HNode1.example.com/library/nginx:latest

    cat ~/.docker/config.json |base64 -w 0
    ewoJImF1dGhzIjogewoJCSJITm9kZTEuZXhhbXBsZS5jb20iOiB7CgkJCSJhdXRoIjogIllXUnRhVzQ2U0dGeVltOXlNVEl6TkRVPSIKCQl9Cgl9LAoJIkh0dHBIZWFkZXJzIjogewoJCSJVc2VyLUFnZW50IjogIkRvY2tlci1DbGllbnQvMTkuMDMuOCAobGludXgpIgoJfQp9

    cat > /vagrant/harbor-secret.yaml << EOF
    apiVersion: v1
    kind: Secret
    metadata:
      name: harbor-secret
    data:
      .dockerconfigjson: ewoJImF1dGhzIjogewoJCSJITm9kZTEuZXhhbXBsZS5jb20iOiB7CgkJCSJhdXRoIjogIllXUnRhVzQ2U0dGeVltOXlNVEl6TkRVPSIKCQl9Cgl9LAoJIkh0dHBIZWFkZXJzIjogewoJCSJVc2VyLUFnZW50IjogIkRvY2tlci1DbGllbnQvMTkuMDMuOCAobGludXgpIgoJfQp9
    type: kubernetes.io/dockerconfigjson
    EOF

    kubectl create -f harbor-secret.yaml


    cat > /vagrant/harbor-nginx-example.yaml << EOF
    apiVersion: apps/v1 # for versions before 1.9.0 use apps/v1beta2
    kind: Deployment
    metadata:
      name: nginx-deployment
    spec:
      selector:
        matchLabels:
          app: nginx
      replicas: 2 # tells deployment to run 2 pods matching the template
      template:
        metadata:
          labels:
            app: nginx
        spec:
          containers:
          - name: nginx
            image: HNode1.example.com/library/nginx:latest
            ports:
            - containerPort: 80
          imagePullSecrets:
            - name: harbor-secret
    EOF

    kubectl create -f harbor-nginx-example.yaml

    mkdir -p /etc/docker/certs.d/HNode1.example.com
    echo "172.20.0.111 HNode1 HNode1.example.com "  >> /etc/hosts
    echo "172.20.0.112 HNode2 HNode2.example.com "  >> /etc/hosts
    cp /vagrant/etcd/ssl/ca.pem /etc/docker/certs.d/HNode1.example.com/ca.crt
    sed -i 's/^Environment="HTTP_PROXY/#&/' /lib/systemd/system/docker.service
    systemctl daemon-reload && systemctl restart docker



---
## 结束

ps:
    镜像与RMP包 链接:https://pan.baidu.com/s/1DqLqlLO3PKQZ7NNvk73NnQ  密码:2nrz